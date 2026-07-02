import { HeadlessCms } from "~/features/shared/abstractions.js";
import { describe, expect, it } from "vitest";
import { ContextPlugin } from "@webiny/handler";
import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "./mocks/article.model";
import type { CmsContext } from "~/types";
import { EntryBeforePublishEventHandler } from "~/features/contentEntry/PublishEntry/index.js";

describe("onEntryBeforePublish", () => {
    it("should update values before publishing", async () => {
        const { handler, tenant } = useHandler({
            plugins: [
                articleModel,
                new ContextPlugin<CmsContext>(context => {
                    context.container.registerFactory(EntryBeforePublishEventHandler, () => ({
                        async handle(event) {
                            const { model, entry } = event.payload;

                            if (model.modelId !== "article") {
                                return;
                            }

                            if (entry.values["desiredEmbargoDate"]) {
                                entry.values["articleEmbargoDate"] =
                                    entry.values["desiredEmbargoDate"];
                            }
                        }
                    }));
                })
            ]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": tenant.id
            }
        });

        const model = await context.container.resolve(HeadlessCms).getModel("article");

        if (!model) {
            throw new Error(`Missing "article" model!`);
        }

        const entry = await context.container.resolve(HeadlessCms).createEntry(model, {
            values: {
                title: "Article #1",
                desiredEmbargoDate: null,
                articleEmbargoDate: null
            }
        });

        const publishedEntry = await context.container
            .resolve(HeadlessCms)
            .publishEntry(model, entry.id);

        expect(publishedEntry.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: null,
            articleEmbargoDate: null
        });

        const revision1 = await context.container
            .resolve(HeadlessCms)
            .createEntryRevisionFrom(model, publishedEntry.id, {
                values: {
                    desiredEmbargoDate: "2024-04-20T00:00:00.000Z"
                }
            });

        const publishedEntry1 = await context.container
            .resolve(HeadlessCms)
            .publishEntry(model, revision1.id);
        expect(publishedEntry1.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: new Date("2024-04-20T00:00:00.000Z"),
            articleEmbargoDate: new Date("2024-04-20T00:00:00.000Z")
        });

        const revision2 = await context.container
            .resolve(HeadlessCms)
            .createEntryRevisionFrom(model, publishedEntry.id, {
                values: {
                    desiredEmbargoDate: "2024-04-25T00:00:00.000Z"
                }
            });

        const publishedEntry2 = await context.container
            .resolve(HeadlessCms)
            .publishEntry(model, revision2.id);
        expect(publishedEntry2.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: new Date("2024-04-25T00:00:00.000Z"),
            articleEmbargoDate: new Date("2024-04-25T00:00:00.000Z")
        });
    });
});
