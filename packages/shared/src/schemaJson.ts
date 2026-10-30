import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Result from "effect/Result";
import * as Schema from "effect/Schema";
import * as SchemaGetter from "effect/SchemaGetter";
import * as SchemaTransformation from "effect/SchemaTransformation";

export const decodeJsonResult = <S extends Schema.Codec<unknown, unknown, never, never>>(
  schema: S,
) => {
  const decode = Schema.decodeExit(Schema.fromJsonString(schema));
  return (input: string) => {
    const result = decode(input);
    if (Exit.isFailure(result)) {
      return Result.fail(result.cause);
    }
    return Result.succeed(result.value);
  };
};

const decodeJsonString = Schema.decodeEffect(Schema.fromJsonString(Schema.Unknown));

export function stripCommentsAndTrailingCommas(input: string): string {
  const len = input.length;
  let result = "";
  let lastSliceStart = 0;
  let inString = false;
  let escaping = false;

  for (let i = 0; i < len; i += 1) {
    const char = input[i];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    // Single-line comment: //
    if (char === "/" && i + 1 < len && input[i + 1] === "/") {
      result += input.slice(lastSliceStart, i);
      i += 2;
      while (i < len && input[i] !== "\n" && input[i] !== "\r") {
        i += 1;
      }
      lastSliceStart = i;
      continue;
    }

    // Multi-line comment: /* ... */
    if (char === "/" && i + 1 < len && input[i + 1] === "*") {
      result += input.slice(lastSliceStart, i);
      i += 2;
      while (i + 1 < len && !(input[i] === "*" && input[i + 1] === "/")) {
        i += 1;
      }
      i = Math.min(i + 2, len);
      lastSliceStart = i;
      i -= 1;
      continue;
    }

    // Trailing comma before } or ]
    if (char === ",") {
      let j = i + 1;
      let nextChar: string | undefined;
      while (j < len) {
        const c = input[j];
        if (!c) break;
        if (c === " " || c === "\t" || c === "\n" || c === "\r") {
          j += 1;
          continue;
        }
        if (c === "/" && j + 1 < len && input[j + 1] === "/") {
          j += 2;
          while (j < len && input[j] !== "\n" && input[j] !== "\r") {
            j += 1;
          }
          continue;
        }
        if (c === "/" && j + 1 < len && input[j + 1] === "*") {
          j += 2;
          while (j + 1 < len && !(input[j] === "*" && input[j + 1] === "/")) {
            j += 1;
          }
          j = Math.min(j + 2, len);
          continue;
        }
        nextChar = c;
        break;
      }
      if (nextChar === "}" || nextChar === "]") {
        result += input.slice(lastSliceStart, i);
        lastSliceStart = i + 1;
      }
    }
  }

  if (lastSliceStart < len) {
    result += input.slice(lastSliceStart);
  }

  return result;
}

const parseLenientJsonGetter = SchemaGetter.transformEffect((input: string) =>
  decodeJsonString(input).pipe(
    Effect.catch(() => decodeJsonString(stripCommentsAndTrailingCommas(input))),
    Effect.mapError((error) => error.issue),
  ),
);

const fromLenientJsonString = new SchemaTransformation.Transformation(
  parseLenientJsonGetter,
  SchemaGetter.stringifyJson(),
);

const prettyJsonString = SchemaGetter.parseJson<string>().pipe(
  SchemaGetter.compose(SchemaGetter.stringifyJson({ space: 2 })),
);

export const fromLenientJson = <S extends Schema.Top>(schema: S) =>
  Schema.String.pipe(Schema.decodeTo(schema, fromLenientJsonString));

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  if (start < 0) {
    return trimmed;
  }

  let depth = 0;
  let inString = false;
  let escaping = false;
  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(start, index + 1);
      }
    }
  }

  return trimmed.slice(start);
}

export const fromJsonStringPretty = <S extends Schema.Top>(schema: S) =>
  Schema.fromJsonString(schema).pipe(
    Schema.encode({
      decode: prettyJsonString,
      encode: prettyJsonString,
    }),
  );
