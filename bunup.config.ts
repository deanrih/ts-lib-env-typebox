import { defineConfig } from "bunup";

export default defineConfig({
	entry: [
		// "./src/**/*.ts",
		"./src/*.ts"
	],
	minify: true,
	target: "bun", // "esnext"
	format: "esm",
	outDir: "./dist",
	splitting: true, //nodeProtocol
	// exports: true,
});
