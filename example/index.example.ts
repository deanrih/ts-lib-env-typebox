import { Type } from "@sinclair/typebox";
import { parseEnv, StringArray } from "../src";

const schema = Type.Object({
	NODE_ENV: Type.Union([Type.Literal("development"), Type.Literal("production")], {
		default: "development",
		examples: ["development", "production"],
	}),
	DEBUG: Type.Boolean({
		default: true,
		examples: [true, false],
	}),
	FEATURE_FLAGS: StringArray,
	VERSION: Type.String({
		default: "local",
		examples: ["0.0.1", "1.0.0", "1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.1+123a", "local", "<commit-hash>"],
	}),
	SERVER_HOST: Type.String({
		// format: "ipv4",
		default: "0.0.0.0",
		examples: ["127.0.0.1", "0.0.0.0"],
	}),
	SERVER_PORT: Type.Number({
		default: 0x0801,
		examples: [3000, 5000, 0x0801, 0xffff],
	}),
	DATABASE_URL: Type.String({
		// format: "uri",
		examples: ["postgresql://<username>:<password>@<host>:<port>/<database>"],
		minLength: 24,
	}),
});

const envSource = Bun.env;
const envSourceFinal = {
	...envSource,
	"VERSION": "1.0.0",
};
const envParsed = parseEnv(schema, envSourceFinal);
const envResult = {
	...envParsed,
	DEV: envParsed.NODE_ENV !== "production",
};

console.log(envResult.DATABASE_URL);
console.log(envResult.DEV);