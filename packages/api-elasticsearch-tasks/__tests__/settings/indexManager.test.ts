import { describe, expect, it } from "vitest";
import { IndexManager } from "~/settings";
import { createOpenSearchClientMock, indexSettings } from "~tests/mocks/elasticsearch";

describe("index manager", () => {
    it("should construct index manager", () => {
        const client = createOpenSearchClientMock();
        const manager = new IndexManager(client, structuredClone(indexSettings));

        expect(manager.settings).toEqual(indexSettings);
    });

    it("should disable indexing", async () => {
        const client = createOpenSearchClientMock();
        const manager = new IndexManager(client, structuredClone({}));

        expect(manager.settings).toEqual({});

        const settings = await manager.disableIndexing("authors");

        expect(settings).toEqual(indexSettings.authors);
        expect(client.disabled.has("authors")).toBeTruthy();
        expect(client.enabled.has("authors")).toBeFalsy();
    });

    it("should enable indexing", async () => {
        const client = createOpenSearchClientMock();
        const manager = new IndexManager(
            client,
            structuredClone({
                authors: indexSettings.authors
            })
        );

        expect(manager.settings).toEqual({
            authors: indexSettings.authors
        });

        await manager.enableIndexing("authors");

        expect(manager.settings).toEqual({
            authors: indexSettings.authors
        });

        expect(client.disabled.has("authors")).toBeFalsy();
        expect(client.enabled.has("authors")).toBeTruthy();
    });
});
