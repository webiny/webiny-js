import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "~/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "./mocks/article.model";
import { EntryBeforePublishEventHandler } from "~/features/contentEntry/PublishEntry/index.js";

describe("onEntryBeforePublish", () => {
    it("should update values before publishing", async () => {
        const { handler, tenant } = useHandler({
            plugins: [
                articleModel,
                container => {
                    container.registerFactory(EntryBeforePublishEventHandler, () => ({
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
                }
            ]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": tenant.id
            }
        });

        const model = (await context.container.resolve(GetModelUseCase).execute("article")).value;

        if (!model) {
            throw new Error(`Missing "article" model!`);
        }

        const entry = (
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: {
                    title: "Article #1",
                    desiredEmbargoDate: null,
                    articleEmbargoDate: null
                }
            })
        ).value;

        const publishedEntry = (
            await context.container.resolve(PublishEntryUseCase).execute(model, entry.id)
        ).value;

        expect(publishedEntry.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: null,
            articleEmbargoDate: null
        });

        const revision1 = (
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, publishedEntry.id, {
                    values: {
                        desiredEmbargoDate: "2024-04-20T00:00:00.000Z"
                    }
                })
        ).value;

        const publishedEntry1 = (
            await context.container.resolve(PublishEntryUseCase).execute(model, revision1.id)
        ).value;
        expect(publishedEntry1.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: new Date("2024-04-20T00:00:00.000Z"),
            articleEmbargoDate: new Date("2024-04-20T00:00:00.000Z")
        });

        const revision2 = (
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, publishedEntry.id, {
                    values: {
                        desiredEmbargoDate: "2024-04-25T00:00:00.000Z"
                    }
                })
        ).value;

        const publishedEntry2 = (
            await context.container.resolve(PublishEntryUseCase).execute(model, revision2.id)
        ).value;
        expect(publishedEntry2.values).toEqual({
            title: "Article #1",
            desiredEmbargoDate: new Date("2024-04-25T00:00:00.000Z"),
            articleEmbargoDate: new Date("2024-04-25T00:00:00.000Z")
        });
    });
});
