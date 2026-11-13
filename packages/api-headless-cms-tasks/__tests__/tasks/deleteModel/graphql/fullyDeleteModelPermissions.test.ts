import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import type { PermissionsArg } from "~tests/context/helpers";
import { createPermissions } from "~tests/context/helpers";

const createModel = async () => {
    const { handler } = useHandler();
    const context = await handler();

    const group = await context.cms.createGroup({
        name: "group",
        description: "description",
        id: "group",
        icon: {
            type: "icon",
            name: "icon",
            value: "icon"
        }
    });

    return await context.cms.createModel({
        modelId: "modelId",
        description: "description",
        name: "name",
        fields: [],
        layout: [],
        singularApiName: "SingularApiName",
        pluralApiName: "PluralApiName",
        group: group.id
    });
};

const withEntryPermission = (entry: PermissionsArg): PermissionsArg[] => {
    return createPermissions().map(permission => {
        if (permission.name !== "cms.contentEntry") {
            return permission;
        }
        return entry;
    });
};

describe("fully delete model permissions", () => {
    it("should refuse when the identity cannot delete entries", async () => {
        const model = await createModel();

        const { handler } = useHandler({
            permissions: withEntryPermission({
                name: "cms.contentEntry",
                rwd: "rw",
                pw: "rcpu"
            })
        });
        const context = await handler();

        await expect(context.cms.fullyDeleteModel(model.modelId)).rejects.toMatchObject({
            message: `Not allowed to delete "${model.modelId}" entries.`
        });
        expect(await context.cms.listModelsBeingDeleted()).toHaveLength(0);
    });

    it("should refuse when the identity can access only its own entries", async () => {
        const model = await createModel();

        const { handler } = useHandler({
            permissions: withEntryPermission({
                name: "cms.contentEntry",
                rwd: "rwd",
                pw: "rcpu",
                own: true
            })
        });
        const context = await handler();

        await expect(context.cms.fullyDeleteModel(model.modelId)).rejects.toMatchObject({
            message: `Not allowed to delete "${model.modelId}" entries.`
        });
        expect(await context.cms.listModelsBeingDeleted()).toHaveLength(0);
    });

    it("should refuse with a not found error for a missing model", async () => {
        const { handler } = useHandler();
        const context = await handler();

        await expect(context.cms.fullyDeleteModel("nonExistingModel")).rejects.toBeDefined();
    });
});
