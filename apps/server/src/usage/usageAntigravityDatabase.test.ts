// @effect-diagnostics nodeBuiltinImport:off
import * as NodeFSP from "node:fs/promises";
import * as NodeOS from "node:os";
import * as NodePath from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, assert, beforeEach, describe, it } from "@effect/vitest";

import { readAntigravityDatabaseRecords } from "./usageAntigravityDatabase.ts";

let dir: string;

beforeEach(async () => {
  dir = await NodeFSP.mkdtemp(NodePath.join(NodeOS.tmpdir(), "usage-agy-test-"));
});

afterEach(async () => {
  await NodeFSP.rm(dir, { recursive: true, force: true });
});

function encodeVarint(val: number): Buffer {
  const bytes: number[] = [];
  let v = val;
  while (v >= 0x80) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v & 0x7f);
  return Buffer.from(bytes);
}

function encodeTag(fieldNum: number, wireType: number): Buffer {
  return encodeVarint((fieldNum << 3) | wireType);
}

function encodeLengthDelimited(fieldNum: number, payload: Buffer): Buffer {
  return Buffer.concat([encodeTag(fieldNum, 2), encodeVarint(payload.length), payload]);
}

function encodeVarintField(fieldNum: number, val: number): Buffer {
  return Buffer.concat([encodeTag(fieldNum, 0), encodeVarint(val)]);
}

function makeSampleBlob(options: {
  sessionId: string;
  stepIndex: number;
  model: string;
  seconds: number;
  nanos?: number;
  totalInput: number;
  cachedInput: number;
  output: number;
  reasoning: number;
}): Buffer {
  const tokenInfo = Buffer.concat([
    encodeVarintField(2, options.totalInput),
    encodeVarintField(10, options.cachedInput),
    encodeVarintField(3, options.output),
    encodeVarintField(9, options.reasoning),
  ]);

  const timestamp = Buffer.concat([
    encodeVarintField(1, options.seconds),
    encodeVarintField(2, options.nanos ?? 0),
  ]);
  const f4 = encodeLengthDelimited(4, timestamp);
  const f9 = encodeLengthDelimited(9, f4);

  const genInfo = Buffer.concat([
    encodeLengthDelimited(19, Buffer.from(options.model)),
    encodeLengthDelimited(4, tokenInfo),
    f9,
  ]);

  const packedSteps = encodeVarint(options.stepIndex);
  const stepField = encodeLengthDelimited(2, packedSteps);
  const sessionField = encodeLengthDelimited(4, Buffer.from(options.sessionId));

  return Buffer.concat([encodeLengthDelimited(1, genInfo), stepField, sessionField]);
}

describe("readAntigravityDatabaseRecords", () => {
  it("returns null for non-existent database file", () => {
    const result = readAntigravityDatabaseRecords(NodePath.join(dir, "nonexistent.db"));
    assert.isNull(result);
  });

  it("returns null for database missing gen_metadata table", () => {
    const dbPath = NodePath.join(dir, "empty.db");
    const db = new DatabaseSync(dbPath);
    db.exec("CREATE TABLE other_table (id INTEGER PRIMARY KEY)");
    db.close();

    const result = readAntigravityDatabaseRecords(dbPath);
    assert.isNull(result);
  });

  it("correctly decodes records from gen_metadata", () => {
    const dbPath = NodePath.join(dir, "conversation.db");
    const db = new DatabaseSync(dbPath);
    db.exec("CREATE TABLE gen_metadata (idx INTEGER PRIMARY KEY, data BLOB)");

    const blob1 = makeSampleBlob({
      sessionId: "session-abc-123",
      stepIndex: 1,
      model: "gemini-3.8-flash",
      seconds: 1726747200,
      nanos: 500000000,
      totalInput: 10000,
      cachedInput: 8000,
      output: 500,
      reasoning: 100,
    });

    const blob2 = makeSampleBlob({
      sessionId: "session-abc-123",
      stepIndex: 2,
      model: "gemini-default",
      seconds: 1726747300,
      nanos: 0,
      totalInput: 15000,
      cachedInput: 10000,
      output: 800,
      reasoning: 200,
    });

    db.prepare("INSERT INTO gen_metadata (idx, data) VALUES (?, ?)").run(1, blob1);
    db.prepare("INSERT INTO gen_metadata (idx, data) VALUES (?, ?)").run(2, blob2);
    db.close();

    const records = readAntigravityDatabaseRecords(dbPath);
    assert.isNotNull(records);
    assert.strictEqual(records!.length, 2);

    const first = records![0]!;
    assert.strictEqual(first.provider, "antigravity");
    assert.strictEqual(first.sessionId, "session-abc-123");
    assert.strictEqual(first.model, "gemini-3.8-flash");
    assert.strictEqual(first.timestampMs, 1726747200500);
    assert.strictEqual(first.totals.uncachedInputTokens, 2000);
    assert.strictEqual(first.totals.cachedInputTokens, 8000);
    assert.strictEqual(first.totals.outputTokens, 500);
    assert.strictEqual(first.totals.reasoningTokens, 100);
    assert.strictEqual(first.dedupeKey, "session-abc-123:1");

    const second = records![1]!;
    assert.strictEqual(second.provider, "antigravity");
    assert.strictEqual(second.sessionId, "session-abc-123");
    // Fallback model replacement
    assert.strictEqual(second.model, "gemini-3.8-flash");
    assert.strictEqual(second.timestampMs, 1726747300000);
    assert.strictEqual(second.totals.uncachedInputTokens, 5000);
    assert.strictEqual(second.totals.cachedInputTokens, 10000);
    assert.strictEqual(second.totals.outputTokens, 800);
    assert.strictEqual(second.totals.reasoningTokens, 200);
    assert.strictEqual(second.dedupeKey, "session-abc-123:2");
  });
});
