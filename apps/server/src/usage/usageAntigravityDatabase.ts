import { DatabaseSync } from "node:sqlite";

import type { UsageTokenTotals } from "@t3tools/contracts";
import type { UsageRecord } from "./usageTranscripts.ts";

/** Decodes varint from buffer starting at offset. Returns [value, newOffset] or null. */
function decodeVarintSafe(buf: Uint8Array, offset: number): [number, number] | null {
  let val = 0n;
  let shift = 0n;
  let i = offset;
  while (i < buf.length) {
    const byte = buf[i++];
    if (byte === undefined) return null;
    const b = BigInt(byte);
    val |= (b & 0x7fn) << shift;
    if ((b & 0x80n) === 0n) return [Number(val), i];
    shift += 7n;
  }
  return null;
}

/** Decodes packed varints from buffer. */
function decodePackedVarints(buf: Uint8Array): number[] {
  const result: number[] = [];
  let i = 0;
  while (i < buf.length) {
    const res = decodeVarintSafe(buf, i);
    if (!res) break;
    result.push(res[0]);
    i = res[1];
  }
  return result;
}

interface ProtobufFields {
  varints: Map<number, number[]>;
  bytes: Map<number, Uint8Array[]>;
}

function decodeProtobuf(buf: Uint8Array): ProtobufFields {
  const varints = new Map<number, number[]>();
  const bytes = new Map<number, Uint8Array[]>();
  let i = 0;
  while (i < buf.length) {
    const tagRes = decodeVarintSafe(buf, i);
    if (!tagRes) break;
    const [tag, nextI] = tagRes;
    i = nextI;
    const fieldNum = tag >>> 3;
    const wireType = tag & 0x7;
    if (wireType === 0) {
      const valRes = decodeVarintSafe(buf, i);
      if (!valRes) break;
      const [val, nextValI] = valRes;
      i = nextValI;
      let list = varints.get(fieldNum);
      if (list === undefined) {
        list = [];
        varints.set(fieldNum, list);
      }
      list.push(val);
    } else if (wireType === 2) {
      const lenRes = decodeVarintSafe(buf, i);
      if (!lenRes) break;
      const [len, nextLenI] = lenRes;
      i = nextLenI;
      if (i + len > buf.length) break;
      const slice = buf.subarray(i, i + len);
      i += len;
      let list = bytes.get(fieldNum);
      if (list === undefined) {
        list = [];
        bytes.set(fieldNum, list);
      }
      list.push(slice);
    } else if (wireType === 1) {
      i += 8;
    } else if (wireType === 5) {
      i += 4;
    } else {
      break;
    }
  }
  return { varints, bytes };
}

/**
 * Reads usage records from an Antigravity SQLite conversation database.
 *
 * Antigravity ACP records per-turn generation metadata in the `gen_metadata`
 * SQLite table as serialized protobuf blobs.
 */
export function readAntigravityDatabaseRecords(filePath: string): readonly UsageRecord[] | null {
  let db: DatabaseSync;
  try {
    db = new DatabaseSync(filePath, { readOnly: true });
  } catch {
    return null;
  }
  try {
    const check = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='gen_metadata'")
      .get();
    if (!check) return null;

    const rows = db.prepare("SELECT idx, data FROM gen_metadata ORDER BY idx ASC").all() as Array<{
      idx: number;
      data: Uint8Array;
    }>;
    const records: UsageRecord[] = [];
    for (const row of rows) {
      if (!row.data) continue;
      const f = decodeProtobuf(row.data);
      const sessionIdBytes = f.bytes.get(4)?.[0];
      const sessionId = sessionIdBytes ? Buffer.from(sessionIdBytes).toString("utf8") : "";
      const f1Bytes = f.bytes.get(1)?.[0];
      if (!f1Bytes) continue;
      const f1 = decodeProtobuf(f1Bytes);
      const modelBytes = f1.bytes.get(19)?.[0];
      let model = modelBytes ? Buffer.from(modelBytes).toString("utf8") : null;
      if (!model) continue;
      if (model === "gemini-default" || model === "default") model = "gemini-3.8-flash";

      let timestampMs: number | null = null;
      const f9Bytes = f1.bytes.get(9)?.[0];
      if (f9Bytes) {
        const f9 = decodeProtobuf(f9Bytes);
        const f4Bytes = f9.bytes.get(4)?.[0];
        if (f4Bytes) {
          const f4 = decodeProtobuf(f4Bytes);
          const sec = f4.varints.get(1)?.[0];
          if (sec !== undefined) {
            const nanos = f4.varints.get(2)?.[0] ?? 0;
            timestampMs = sec * 1000 + Math.floor(nanos / 1e6);
          }
        }
      }
      if (timestampMs === null) continue;

      let uncachedInputTokens = 0;
      let cachedInputTokens = 0;
      let outputTokens = 0;
      let reasoningTokens = 0;

      const f4Bytes = f1.bytes.get(4)?.[0];
      if (f4Bytes) {
        const tokenInfo = decodeProtobuf(f4Bytes);
        const totalInput = tokenInfo.varints.get(2)?.[0] ?? 0;
        const cached = tokenInfo.varints.get(10)?.[0] ?? 0;
        const output = tokenInfo.varints.get(3)?.[0] ?? 0;
        const reasoning = tokenInfo.varints.get(9)?.[0] ?? 0;

        cachedInputTokens = cached;
        uncachedInputTokens = Math.max(0, totalInput - cached);
        outputTokens = output;
        reasoningTokens = reasoning;
      }

      const stepBytes = f.bytes.get(2)?.[0];
      const steps = stepBytes ? decodePackedVarints(stepBytes) : [];
      const stepIndex = steps.length > 0 ? steps[0] : row.idx;
      const dedupeKey = sessionId ? `${sessionId}:${stepIndex}` : null;

      const totals: UsageTokenTotals = {
        uncachedInputTokens,
        cachedInputTokens,
        cacheCreationTokens: 0,
        outputTokens,
        reasoningTokens,
      };

      records.push({
        provider: "antigravity",
        timestampMs,
        model,
        sessionId,
        totals,
        reportedCostUsd: null,
        dedupeKey,
      });
    }
    return records;
  } catch {
    return null;
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}
