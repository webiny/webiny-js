import { describe, expect, it } from "vitest";
import { IndexManager } from "~/settings";
import { createOpenSearchClientMock, indexSettings } from "~tests/mocks/elasticsearch";
import type { DisableIndexing } from "~/settings/abstractions/DisableIndexing";
import type { EnableIndexing } from "~/settings/abstractions/EnableIndexing";
import type { ExtendedClient } from "~tests/mocks/elasticsearch";

const createMockDisableIndexing = (client: ExtendedClient): DisableIndexing.Interface => ({
    exec: async (index: string) => {
        const response = await client.indices.getSettings({ index });
        const body = response.body as Record<string, any>;
        const settings = body[index].settings.index;
        client.disabled.add(index);
        client.enabled.delete(index);
        return {
            numberOfReplicas: settings.number_of_replicas,
            refreshInterval: settings.refresh_interval
        };
    }
});

const createMockEnableIndexing = (client: ExtendedClient): EnableIndexing.Interface => ({
    exec: async (index: string) => {
        client.disabled.delete(index);
        client.enabled.add(index);
    }
});

describe("index manager", () => {
    it("should construct index manager", () => {
        const client = createOpenSearchClientMock();
        const disableIndexing = createMockDisableIndexing(client);
        const enableIndexing = createMockEnableIndexing(client);
        const manager = new IndexManager(
            client,
            disableIndexing,
            enableIndexing,
            structuredClone(indexSettings)
        );

        expect(manager.settings).toEqual(indexSettings);
    });

    it("should disable indexing", async () => {
        const client = createOpenSearchClientMock();
        const disableIndexing = createMockDisableIndexing(client);
        const enableIndexing = createMockEnableIndexing(client);
        const manager = new IndexManager(
            client,
            disableIndexing,
            enableIndexing,
            structuredClone({})
        );

        expect(manager.settings).toEqual({});

        const settings = await manager.disableIndexing("authors");

        expect(settings).toEqual(indexSettings.authors);
        expect(client.disabled.has("authors")).toBeTruthy();
        expect(client.enabled.has("authors")).toBeFalsy();
    });

    it("should enable indexing", async () => {
        const client = createOpenSearchClientMock();
        const disableIndexing = createMockDisableIndexing(client);
        const enableIndexing = createMockEnableIndexing(client);
        const manager = new IndexManager(
            client,
            disableIndexing,
            enableIndexing,
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
