import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { UpdateEntrySystemUseCase } from "~/features/contentEntry/UpdateEntrySystem/index.js";
import { CmsEntrySystemField } from "~/features/contentEntry/EntrySystemField/index.js";
import type { CmsEntryListWhere, ICmsEntrySystem } from "~/types/index.js";

interface ITestReview {
    reviewId: string;
    state: string;
    stepState: string;
}

const toSystem = (review: ITestReview) => ({ review }) as unknown as Partial<ICmsEntrySystem>;

const toWhere = (review: Record<string, unknown>) => {
    return { system: { review } } as unknown as CmsEntryListWhere;
};

const reviewField = createModelField({
    id: "review",
    fieldId: "review",
    storageId: "review",
    type: "object",
    label: "Review",
    settings: {
        fields: ["reviewId", "state", "stepState"].map(fieldId => {
            return createModelField({
                id: fieldId,
                fieldId,
                storageId: fieldId,
                type: "text",
                label: fieldId
            });
        })
    }
});

const registerReviewField = (container: Container) => {
    container.registerInstance(CmsEntrySystemField, { field: reviewField });
};

const articleModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" })]
});

describe("filtering by a registered entry system field", () => {
    const { handler, tenant } = useHandler({ plugins: [articleModel, registerReviewField] });

    it("filters latest entries by the nested system values", async () => {
        const context = await handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });
        const model = (await context.container.resolve(GetModelUseCase).execute("article")).value;
        const createEntry = context.container.resolve(CreateEntryUseCase);
        const updateSystem = context.container.resolve(UpdateEntrySystemUseCase);

        const approved = (await createEntry.execute(model, { values: { title: "A" } })).value;
        const inProgress = (await createEntry.execute(model, { values: { title: "B" } })).value;
        await createEntry.execute(model, { values: { title: "C" } });

        await updateSystem.execute(
            model,
            approved.id,
            toSystem({ reviewId: "r1", state: "approved", stepState: "approved" })
        );
        await updateSystem.execute(
            model,
            inProgress.id,
            toSystem({ reviewId: "r1", state: "inProgress", stepState: "inReview" })
        );

        const list = context.container.resolve(ListLatestEntriesUseCase);

        const byState = await list.execute(model, { where: toWhere({ state: "approved" }) });
        expect(byState.value.entries.map(e => e.id)).toEqual([approved.id]);

        const byStep = await list.execute(model, {
            where: toWhere({ stepState_in: ["inReview"] })
        });
        expect(byStep.value.entries.map(e => e.id)).toEqual([inProgress.id]);

        const byReview = await list.execute(model, {
            where: toWhere({ reviewId: "r1" }),
            sort: ["createdOn_ASC"]
        });
        expect(byReview.value.entries.map(e => e.id)).toEqual([approved.id, inProgress.id]);
    });
});
