import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import { UpdateEntrySystemUseCase } from "~/features/contentEntry/UpdateEntrySystem/index.js";
import type { ICmsEntrySystem } from "~/types/index.js";

interface ITestWorkflow {
    workflowId: string;
    reviewState: string;
    stepId: string;
    stepName: string;
    stepState: string;
}

const toSystem = (workflow: ITestWorkflow) => ({ workflow }) as unknown as Partial<ICmsEntrySystem>;

const articleModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Article",
    modelId: "article",
    fields: [createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" })]
});

describe("filtering by system.workflow", () => {
    const { handler, tenant } = useHandler({ plugins: [articleModel] });

    it("filters latest entries by reviewState and stepState", async () => {
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
            toSystem({
                workflowId: "wf1",
                reviewState: "approved",
                stepId: "s2",
                stepName: "Legal",
                stepState: "approved"
            })
        );
        await updateSystem.execute(
            model,
            inProgress.id,
            toSystem({
                workflowId: "wf1",
                reviewState: "inProgress",
                stepId: "s1",
                stepName: "Editor",
                stepState: "inReview"
            })
        );

        const list = context.container.resolve(ListLatestEntriesUseCase);

        const byReview = await list.execute(model, {
            where: { system: { workflow: { reviewState: "approved" } } }
        });
        expect(byReview.value.entries.map(e => e.id)).toEqual([approved.id]);

        const byStep = await list.execute(model, {
            where: { system: { workflow: { stepState_in: ["inReview"] } } }
        });
        expect(byStep.value.entries.map(e => e.id)).toEqual([inProgress.id]);

        const byWorkflow = await list.execute(model, {
            where: { system: { workflow: { workflowId: "wf1" } } },
            sort: ["createdOn_ASC"]
        });
        expect(byWorkflow.value.entries.map(e => e.id)).toEqual([approved.id, inProgress.id]);
    });
});
