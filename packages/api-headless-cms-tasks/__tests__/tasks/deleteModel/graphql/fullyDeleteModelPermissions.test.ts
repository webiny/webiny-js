import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { DeleteModelOperations } from "~/graphql/deleteModel/abstractions.js";
import { CreateGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/CreateGroup/index.js";
import { CreateModelUseCase } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

const createModel = async () => {
    const { handler } = useHandler();
    const context = await handler();

    const group = (
        await context.container.resolve(CreateGroupUseCase).execute({
            name: "group",
            description: "description",
            id: "group",
            icon: {
                type: "icon",
                name: "icon",
                value: "icon"
            }
        })
    ).value;

    return (
        await context.container.resolve(CreateModelUseCase).execute({
            modelId: "modelId",
            description: "description",
            name: "name",
            fields: [],
            layout: [],
            singularApiName: "SingularApiName",
            pluralApiName: "PluralApiName",
            group: group.id
        })
    ).value;
};

/**
 * Full access to groups and models, and the given access to entries. CMS permissions are joined
 * by `_src`, so they must share one.
 */
const withEntryPermission = (entry: Record<string, unknown>): SecurityPermission[] => {
    return [
        { _src: "role", name: "cms.endpoint.manage" },
        { _src: "role", name: "cms.contentModelGroup", rwd: "rwd" },
        { _src: "role", name: "cms.contentModel", rwd: "rwd" },
        { _src: "role", name: "cms.contentEntry", ...entry }
    ] as SecurityPermission[];
};

describe("fully delete model permissions", () => {
    it("should refuse when the identity cannot delete entries", async () => {
        const model = await createModel();

        const { handler } = useHandler({
            permissions: withEntryPermission({ rwd: "rw", pw: "rcpu" })
        });
        const context = await handler();
        const operations = context.container.resolve(DeleteModelOperations);

        await expect(operations.fullyDeleteModel(model.modelId)).rejects.toMatchObject({
            message: `Not allowed to delete "${model.modelId}" entries.`
        });
        expect(await operations.listModelsBeingDeleted()).toHaveLength(0);
    });

    it("should refuse when the identity can access only its own entries", async () => {
        const model = await createModel();

        const { handler } = useHandler({
            permissions: withEntryPermission({ rwd: "rwd", pw: "rcpu", own: true })
        });
        const context = await handler();
        const operations = context.container.resolve(DeleteModelOperations);

        await expect(operations.fullyDeleteModel(model.modelId)).rejects.toMatchObject({
            message: `Not allowed to delete "${model.modelId}" entries.`
        });
        expect(await operations.listModelsBeingDeleted()).toHaveLength(0);
    });

    it("should refuse with a not found error for a missing model", async () => {
        const { handler } = useHandler();
        const context = await handler();

        await expect(
            context.container.resolve(DeleteModelOperations).fullyDeleteModel("nonExistingModel")
        ).rejects.toBeDefined();
    });
});
