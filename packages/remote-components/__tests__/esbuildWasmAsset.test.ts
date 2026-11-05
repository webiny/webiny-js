import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import {
    generateEsbuildWasmAsset,
    copyEsbuildWasmAsset
    // @ts-expect-error Plain build script, no type declarations.
} from "../scripts/generateEsbuildWasmAsset.js";

let dir: string;
let source: string;
let output: string;

const gunzip = (file: string) => zlib.gunzipSync(fs.readFileSync(file)).toString();

beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "esbuild-wasm-asset-"));
    source = path.join(dir, "esbuild.wasm");
    output = path.join(dir, "src/api/bundler/esbuild.wasm.gz");
    fs.writeFileSync(source, "wasm v1");
});

afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
});

describe("generateEsbuildWasmAsset", () => {
    it("writes the gzipped binary and leaves no temporary file", async () => {
        await generateEsbuildWasmAsset({ source, output });

        expect(gunzip(output)).toBe("wasm v1");
        expect(fs.readdirSync(path.dirname(output))).toEqual(["esbuild.wasm.gz"]);
    });

    it("keeps an asset that already holds the installed binary", async () => {
        await generateEsbuildWasmAsset({ source, output });
        const marker = new Date("2020-01-01T00:00:00Z");
        fs.utimesSync(output, marker, marker);

        await generateEsbuildWasmAsset({ source, output });

        expect(fs.statSync(output).mtime).toEqual(marker);
    });

    it("regenerates when the binary changes, whatever the modification times", async () => {
        await generateEsbuildWasmAsset({ source, output });
        fs.writeFileSync(source, "wasm v2");
        const older = new Date("2000-01-01T00:00:00Z");
        fs.utimesSync(source, older, older);

        await generateEsbuildWasmAsset({ source, output });

        expect(gunzip(output)).toBe("wasm v2");
    });

    it("regenerates a partial asset", async () => {
        await generateEsbuildWasmAsset({ source, output });
        const partial = fs.readFileSync(output).subarray(0, 5);
        fs.writeFileSync(output, partial);

        await generateEsbuildWasmAsset({ source, output });

        expect(gunzip(output)).toBe("wasm v1");
    });
});

describe("copyEsbuildWasmAsset", () => {
    it("copies the asset to where the bundler loads it from in dist", async () => {
        await generateEsbuildWasmAsset({ source, output });
        const dist = path.join(dir, "dist");

        const target = copyEsbuildWasmAsset(dist, { from: output });

        expect(target).toBe(path.join(dist, "api/bundler/esbuild.wasm.gz"));
        expect(gunzip(target)).toBe("wasm v1");
    });
});
