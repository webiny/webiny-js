import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { StorageTransform } from "~/features/storage/abstractions/StorageTransform.js";
import { CompressedTextStorageTransform } from "~/features/storage/fields/CompressedTextStorageTransform.js";

/**
 * Stores the value as-is under a `compression` marker, so the tests only check how the
 * transform parses what it reads from storage.
 */
const compressionHandler = {
    async compress(value: string) {
        return { compression: "test", value };
    },
    async decompress(data: { value: string }) {
        return data.value;
    }
};

const createTransform = () => {
    const container = new Container();
    container.registerInstance(
        CompressionHandler,
        compressionHandler as unknown as CompressionHandler.Interface
    );
    container.register(CompressedTextStorageTransform);
    return container.resolve(StorageTransform);
};

const params = (value: unknown) => {
    return { value, model: {}, field: {}, getStorageTransform: () => null } as any;
};

describe("compressed text storage transform", () => {
    it("should read back a compressed value", async () => {
        const transform = createTransform();

        const stored = await transform.toStorage(params("Some long text"));
        expect(await transform.fromStorage(params(stored))).toBe("Some long text");
    });

    it("should return an uncompressed value unchanged", async () => {
        const transform = createTransform();

        expect(await transform.fromStorage(params("Plain text"))).toBe("Plain text");
    });

    it("should not parse a stored value with prototype pollution keys", async () => {
        const transform = createTransform();
        const value = `{"compression":"test","value":"x","__proto__":{"polluted":true}}`;

        expect(await transform.fromStorage(params(value))).toBe(value);
        expect(({} as any).polluted).toBeUndefined();
    });
});
