import { describe, expect, it } from "bun:test";
import { Type } from "@sinclair/typebox";
import { parseEnv } from "../src";

const schemaStringOnly = Type.Object({
	FIELD_ONE: Type.String(),
});
const schemaNumberOnly = Type.Object({
	FIELD_ONE: Type.Number(),
});

describe(() => {
	it("Valid string", () => {
		const envSource = {
			"FIELD_ONE": "string content",
		};
		const envParsed = parseEnv(schemaStringOnly, envSource);
		const value = envParsed.FIELD_ONE;

		expect(value).toBeTypeOf("string");
		expect(value).toBe("string content");
	});
	it("Valid number", () => {
		const envSource = {
			"FIELD_ONE": "123",
		};

		const envParsed = parseEnv(schemaNumberOnly, envSource);
		const valueOne = envParsed.FIELD_ONE;

		expect(valueOne).toBeTypeOf("number");
		expect(valueOne).toBe(123);
	});
});
