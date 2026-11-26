import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { HttpStreamBody } from "@webiny/api-kernel-core";
import { Asset } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { CallableContentsReader } from "@webiny/api-file-manager/features/assetDelivery/transformation/index.js";
import { StreamAssetReply } from "@webiny/api-file-manager/features/assetDelivery/StreamAssetReply/StreamAssetReply.js";
import { LocalOutputStrategy } from "~/assetDelivery/LocalOutputStrategy.js";
import { ObjectStorageContentsReader } from "~/assetDelivery/ObjectStorageContentsReader.js";
import { TENANT_ID } from "./utils/helpers.js";
import { storageBackends } from "./utils/storageBackends.js";

const KEY = `tenants/${TENANT_ID}/files/abc/video.mp4`;

const createAsset = (size: number) => {
    return new Asset({
        id: "abc",
        tenant: TENANT_ID,
        key: KEY,
        size,
        contentType: "video/mp4"
    });
};

// What the delivery route hands the transport: the reply's body, after the output strategy ran.
const deliver = async (asset: Asset) => {
    const streamAssetReply = new StreamAssetReply();
    const outputStrategy = new LocalOutputStrategy(streamAssetReply);
    const reply = await outputStrategy.output(asset);
    return reply.getBody();
};

const toStreamBody = (body: unknown): HttpStreamBody => {
    if (!HttpStreamBody.is(body)) {
        throw new Error("The reply's body is not streamed.");
    }
    return body;
};

const collect = async (body: HttpStreamBody) => {
    const chunks: Buffer[] = [];
    for await (const chunk of body.source) {
        const buffer = Buffer.from(chunk);
        chunks.push(buffer);
    }
    return chunks;
};

describe.each(storageBackends)("asset delivery: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    it("should stream a stored file to the transport in chunks", async () => {
        const storage = backend.storage();
        const contents = Buffer.alloc(1024 * 1024, "v");
        await storage.put(KEY, contents);
        const asset = createAsset(contents.length);
        const reader = ObjectStorageContentsReader.create(storage);
        asset.setContentsReader(reader);

        const body = await deliver(asset);

        const streamBody = toStreamBody(body);
        const chunks = await collect(streamBody);
        expect(chunks.length).toBeGreaterThan(1);
        expect(Buffer.concat(chunks).equals(contents)).toBe(true);
    });

    it("should send contents already in memory, such as a resized image, as one chunk", async () => {
        const contents = Buffer.from("resized");
        // The reader `LocalSharpTransform` gives a resized image.
        const reader = CallableContentsReader.create(() => contents);
        const asset = createAsset(contents.length);
        asset.setContentsReader(reader);

        const body = await deliver(asset);

        const streamBody = toStreamBody(body);
        const chunks = await collect(streamBody);
        expect(chunks).toEqual([contents]);
    });

    it("should fail before sending anything when the file has no contents", async () => {
        const storage = backend.storage();
        const reader = ObjectStorageContentsReader.create(storage);
        const asset = createAsset(10);
        asset.setContentsReader(reader);

        await expect(deliver(asset)).rejects.toThrow(`No contents stored for asset "${KEY}".`);
    });
});
