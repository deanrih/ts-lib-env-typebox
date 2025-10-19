/**
 * @file
 * Copyright (c) 2025 Dean Rikrik Ichsan Hakiki.
 * All rights reserved.
 *
 * This code is licensed under the MIT License.
 *
 * @license     MIT
 * @description Utility to work with environment variables utilizing schema type validation of typebox.
 * @author      Dean Rikrik Ichsan Hakiki (deanrih)
 * @version     1.0.0
 * @copyright   Dean Rikrik Ichsan Hakiki 2025
 */

import type { StaticDecode, TLiteral, TSchema, TString, TTransform, TUnion } from "@sinclair/typebox";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

/**
 * Custom TypeBox schema declaration that accepts semi-colon (;) separated values.
 *
 * @example <caption>Example usage of .</caption>
 * //input string
 * const input = "key-1;key-2;env-variable;enable-incremental-build;";
 */
const StringArray: TTransform<TString, string[]> = Type.Transform(Type.String())
	.Decode((value) => value.toLowerCase().split(";").filter(Boolean))
	.Encode((value) => value.join(";"));

/**
 * @returns {StaticDecode}  Static version of parsed environment variable based on the schema
 * @throws  {Error}         Provided environment variable does not match the schema
 */
function parseEnv<T extends TSchema>(schema: T, env: NodeJS.ProcessEnv = Bun.env): StaticDecode<T> {
	const value = env;

	Value.Clean(schema, value);
	Value.Default(schema, value);
	Value.Convert(schema, value);

	const check = Value.Check(schema, value);

	if (check) {
		return Value.Decode(schema, value);
	}

	const error = Value.Errors(schema, value).First();

	if (error === undefined) {
		throw new Error("Failed to fetch environment variables.");
	}

	const errorMessages: string[] = [];
	const causes = new Set<string>();

	if (error.errors.length > 0) {
		for (let idx = 0; idx < error.errors.length; idx += 1) {
			const currentError = error.errors[idx];
			if (currentError === undefined) {
				continue;
			}
			const errorContent = currentError.First();
			if (errorContent === undefined) {
				continue;
			}

			const received =
				errorContent.value === undefined ? `'${errorContent.value}' (nothing)` : `'${errorContent.value}'`;
			errorMessages.push(`'${errorContent.path}': ${errorContent.message} received ${received} instead`);
			causes.add(errorContent.path);
		}
	} else {
		const typeBoxKindSymbol = "Symbol(TypeBox.Kind)";
		const errorSchema = error.schema;
		const kindSymbol = Object.getOwnPropertySymbols(errorSchema)[0];

		if (kindSymbol === undefined || kindSymbol.toString() !== typeBoxKindSymbol) {
			throw new Error("Failed to detect schema type/kind of a variable");
		}

		const variableKind = (<string>errorSchema[kindSymbol as never]).toLowerCase();

		let hasExpectedValue = true;
		const expectedValues: string[] = [];

		switch (variableKind) {
			case "boolean":
				{
					const localExpectedValues = ["true", "false"];
					expectedValues.push(...localExpectedValues);
				}
				break;
			case "number":
				{
					hasExpectedValue = false;
				}
				break;
			case "string":
				{
					hasExpectedValue = false;
				}
				break;
			case "union":
				{
					const localErrorSchema = <TUnion>errorSchema;
					expectedValues.push(
						...localErrorSchema.anyOf
							.map((x) => {
								const localKindSymbol = Object.getOwnPropertySymbols(x)[0];
								if (localKindSymbol === undefined || localKindSymbol.toString() !== typeBoxKindSymbol) {
									throw new Error("Failed to detect schema type/kind of a variable");
								}

								const localKind = (<string>x[localKindSymbol as never]).toLowerCase();
								switch (localKind) {
									case "literal": {
										return (<TLiteral>x).const.toString();
									}
									default:
										throw new Error(`Unknown kind: '${localKind}'`);
								}
							})
							.filter(Boolean),
					);
				}
				break;

			default:
				throw new Error(`Unknown kind: '${variableKind}'`);
		}

		const received = error.value === undefined ? `'${error.value}' (nothing)` : `'${error.value}'`;
		errorMessages.push(`'${error.path}': ${error.message} received ${received} instead`);
		if (errorSchema.description !== undefined) {
			errorMessages.push(`> description: ${errorSchema.description}`);
		}

		if (hasExpectedValue) {
			errorMessages.push(`> expected: ${expectedValues}`);
		}

		if (errorSchema.examples !== undefined) {
			errorMessages.push(`> examples: ${errorSchema.examples}`);
		}
		causes.add(error.path);
	}

	const finalMessage = errorMessages.join("\n");

	throw new Error(finalMessage, {
		cause: Array.from(causes.values()),
	});
}

export { parseEnv, StringArray };
