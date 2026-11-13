import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import {
    EventPublisher,
    EventPublisherFeature
} from "@webiny/app/features/eventPublisher/index.js";
import { EnvConfig } from "@webiny/app/features/envConfig/index.js";
import { WebsocketEvent } from "@webiny/app/features/websocketEvents/index.js";
import { RecordChangesFeature } from "@webiny/app/features/recordChanges/index.js";
import { GetModelUseCase } from "~/features/model/getModel/abstractions.js";
import { GetEntryGateway } from "~/features/contentEntry/getEntry/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/GetEntryUseCase.js";
import { GetEntryRepository } from "~/features/contentEntry/getEntry/GetEntryRepository.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/ContentEntriesCacheProvider.js";
import { ContentEntriesCacheProvider as CacheProviderAbstraction } from "~/features/contentEntry/abstractions.js";
import type { CmsContentEntry, CmsModel } from "~/types.js";
import { EntryEventsFeature } from "./feature.js";

const entry = (entryId: string, title: string) =>
    ({ id: `${entryId}#0001`, entryId, values: { title } }) as unknown as CmsContentEntry;

/*
 * Real publisher, record-change messages, handlers, use case, repository and cache; fake server. The websocket bridge
 * publishes `WebsocketEvent`s through the same publisher, so publishing one here is what an incoming
 * message does at runtime.
 */
const setup = (stored: CmsContentEntry) => {
    const fetched: string[] = [];
    const container = new Container();

    // The publisher reads `debug` from here to decide whether to log.
    container.registerInstance(EnvConfig, {
        get: () => undefined
    } as unknown as EnvConfig.Interface);
    EventPublisherFeature.register(container);
    container.register(ContentEntriesCacheProvider).inSingletonScope();
    container.registerInstance(GetModelUseCase, {
        execute: async ({ modelId }: { modelId: string }) => ({ modelId }) as CmsModel
    });
    container.registerInstance(GetEntryGateway, {
        execute: async ({ id }: { id: string }) => {
            fetched.push(id);
            return stored;
        }
    });
    container.register(GetEntryUseCase);
    container.register(GetEntryRepository).inSingletonScope();
    RecordChangesFeature.register(container);
    EntryEventsFeature.register(container);

    const receive = (payload: { action: string; data: unknown }) =>
        container.resolve(EventPublisher).publish(new WebsocketEvent(payload));
    const cache = (modelId: string) => container.resolve(CacheProviderAbstraction).get(modelId);

    return { receive, cache, fetched };
};

describe("entry events", () => {
    it("reads a created entry back into its model's cache", async () => {
        const { receive, cache, fetched } = setup(entry("e1", "Coffee guide"));

        await receive({
            action: "record.changed",
            data: { type: "cms.entry.guide", id: "e1", change: "created" }
        });

        expect(fetched).toEqual(["e1"]);
        expect(cache("guide").getItems()).toEqual([entry("e1", "Coffee guide")]);
        expect(cache("article").count()).toBe(0);
    });

    it("replaces the cached copy of an updated entry", async () => {
        const { receive, cache } = setup(entry("e1", "Coffee guide, second edition"));
        cache("guide").setItems([entry("e1", "Coffee guide"), entry("e2", "Tea guide")]);

        await receive({
            action: "record.changed",
            data: { type: "cms.entry.guide", id: "e1", change: "updated" }
        });

        expect(cache("guide").getItem(item => item.entryId === "e1")?.values.title).toBe(
            "Coffee guide, second edition"
        );
        expect(cache("guide").count()).toBe(2);
    });

    it("drops a deleted entry without reading it back", async () => {
        const { receive, cache, fetched } = setup(entry("e1", "Coffee guide"));
        cache("guide").setItems([entry("e1", "Coffee guide"), entry("e2", "Tea guide")]);

        await receive({
            action: "record.changed",
            data: { type: "cms.entry.guide", id: "e1", change: "deleted" }
        });

        expect(fetched).toEqual([]);
        expect(
            cache("guide")
                .getItems()
                .map(item => item.entryId)
        ).toEqual(["e2"]);
    });

    it("ignores record changes that are not about entries", async () => {
        const { receive, fetched } = setup(entry("e1", "Coffee guide"));

        await receive({
            action: "record.changed",
            data: { type: "security.team", id: "team-1", change: "updated" }
        });

        expect(fetched).toEqual([]);
    });
});
