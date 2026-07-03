import { describe, it, expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { WebhooksTransformerFeature } from "~/api/features/Transformers/feature.js";
import { WebhookTransformer } from "~/api/features/Transformers/abstractions/WebhookTransformer.js";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

const makeCmsEntry = (
    overrides?: Partial<WebhookCmsEntryValues>
): CmsEntry<WebhookCmsEntryValues> =>
    ({
        entryId: "wh-1",
        createdOn: "2026-01-01T00:00:00Z",
        savedOn: "2026-01-02T00:00:00Z",
        values: {
            name: "Shop Sync",
            slug: "shop-sync",
            endpointUrl: "https://example.com/hook",
            description: "Syncs shop data",
            enabled: true,
            events: ["cms.entry.product.published"],
            signingSecret: "whsec_abc",
            ...overrides
        }
    }) as unknown as CmsEntry<WebhookCmsEntryValues>;

describe("WebhookTransformer", () => {
    const container = new Container();
    WebhooksTransformerFeature.register(container);
    const transformer = container.resolve(WebhookTransformer);

    describe("fromStorage", () => {
        it("maps CmsEntry fields to a flat Webhook", () => {
            const entry = makeCmsEntry();
            const webhook = transformer.fromStorage(entry);

            expect(webhook).toEqual({
                id: "wh-1",
                name: "Shop Sync",
                slug: "shop-sync",
                endpointUrl: "https://example.com/hook",
                description: "Syncs shop data",
                enabled: true,
                events: ["cms.entry.product.published"],
                signingSecret: "whsec_abc",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z"
            });
        });

        it("handles undefined description", () => {
            const entry = makeCmsEntry({ description: undefined });
            const webhook = transformer.fromStorage(entry);

            expect(webhook.description).toBeUndefined();
        });

        it("handles empty events array", () => {
            const entry = makeCmsEntry({ events: [] });
            const webhook = transformer.fromStorage(entry);

            expect(webhook.events).toEqual([]);
        });
    });

    describe("toStorage", () => {
        it("maps flat Webhook to WebhookCmsEntryValues", () => {
            const values = transformer.toStorage({
                id: "wh-1",
                name: "Shop Sync",
                slug: "shop-sync",
                endpointUrl: "https://example.com/hook",
                description: "Syncs shop data",
                enabled: true,
                events: ["cms.entry.product.published"],
                signingSecret: "whsec_abc",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-02T00:00:00Z"
            });

            expect(values).toEqual({
                name: "Shop Sync",
                slug: "shop-sync",
                endpointUrl: "https://example.com/hook",
                description: "Syncs shop data",
                enabled: true,
                events: ["cms.entry.product.published"],
                signingSecret: "whsec_abc"
            });
        });

        it("strips id, createdOn, savedOn from output", () => {
            const values = transformer.toStorage({
                id: "wh-1",
                name: "Test",
                slug: "test",
                endpointUrl: "https://example.com",
                enabled: false,
                events: [],
                signingSecret: "whsec_x",
                createdOn: "2026-01-01T00:00:00Z",
                savedOn: "2026-01-01T00:00:00Z"
            });

            expect(values).not.toHaveProperty("id");
            expect(values).not.toHaveProperty("createdOn");
            expect(values).not.toHaveProperty("savedOn");
        });
    });
});
