import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ValidationFeature } from "~/features/validation/index.js";
import { CmsContext } from "~/features/shared/abstractions.js";
import { SimpleEntryDataFactoriesFeature } from "~/features/simpleContentEntries/entryDataFactories/SimpleEntryDataFactoriesFeature.js";
import { CreateSimpleEntryDataFactory } from "~/features/simpleContentEntries/entryDataFactories/createSimpleEntryData/index.js";
import { ENTRY_META_FIELDS } from "~/constants.js";
import type { CmsModel } from "~/types/index.js";

/*
 * The reduced shape is the whole design, so this test asserts it exactly: the eleven fields, the
 * four pinned values, and the absence of every meta field the regular entry carries.
 */
const EXPECTED_FIELDS = [
    "id",
    "entryId",
    "tenant",
    "modelId",
    "createdOn",
    "createdBy",
    "values",
    "version",
    "status",
    "locked",
    "expiresAt"
];

const identity = {
    id: "id-12345678",
    displayName: "John Doe",
    type: "admin"
};

const createModel = (): CmsModel => {
    return {
        modelId: "simpleModel",
        name: "Simple Model",
        tenant: "root",
        locale: "en-US",
        titleFieldId: "title",
        layout: [["title"]],
        tags: ["cms:simple"],
        fields: [
            {
                id: "titleFieldId",
                fieldId: "title",
                storageId: "text@titleFieldId",
                type: "text",
                label: "Title"
            }
        ]
    } as unknown as CmsModel;
};

describe("CreateSimpleEntryDataFactory", () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
        ValidationFeature.register(container);
        SimpleEntryDataFactoriesFeature.register(container);

        container.registerInstance(CmsContext, { container } as unknown as CmsContext.Interface);
        container.registerInstance(IdentityContext, {
            getIdentity: () => identity
        } as unknown as IdentityContext.Interface);
        container.registerInstance(TenantContext, {
            getTenant: () => ({ id: "root", name: "Root" })
        } as unknown as TenantContext.Interface);
    });

    const create = async (input: { id?: string; values: Record<string, unknown> }) => {
        const factory = container.resolve(CreateSimpleEntryDataFactory);
        const { entry } = await factory.create(createModel(), input);
        return entry;
    };

    it("produces exactly the eleven fields of the reduced shape", async () => {
        const entry = await create({ values: { title: "Hello" } });

        expect(Object.keys(entry).sort()).toEqual([...EXPECTED_FIELDS].sort());
    });

    it("pins version, status, locked and expiresAt", async () => {
        const entry = await create({ values: { title: "Hello" } });

        expect(entry.version).toBe(1);
        expect(entry.status).toBe("draft");
        expect(entry.locked).toBe(false);
        expect(entry.expiresAt).toBeNull();
    });

    it("builds id as `<entryId>#0001` so parseIdentifier keeps working", async () => {
        const entry = await create({ values: { title: "Hello" } });

        expect(entry.id).toBe(`${entry.entryId}#0001`);
        expect(entry.id).toMatch(/^[a-zA-Z0-9-]+#0001$/);
    });

    it("carries none of the 26 dropped meta fields", async () => {
        const entry = await create({ values: { title: "Hello" } });

        const dropped = ENTRY_META_FIELDS.filter(
            field => field !== "createdOn" && field !== "createdBy"
        );
        const present = dropped.filter(field => field in entry);

        expect(present).toEqual([]);
    });

    it("stamps createdOn and createdBy from the current identity", async () => {
        const entry = await create({ values: { title: "Hello" } });

        expect(entry.createdBy).toEqual(identity);
        expect(new Date(entry.createdOn).toISOString()).toBe(entry.createdOn);
    });

    it("honours a caller supplied id", async () => {
        const entry = await create({ id: "my-own-id", values: { title: "Hello" } });

        expect(entry.entryId).toBe("my-own-id");
        expect(entry.id).toBe("my-own-id#0001");
    });

    it("rejects an invalid caller supplied id", async () => {
        await expect(create({ id: "-nope-", values: { title: "Hello" } })).rejects.toThrow(
            /The provided ID is not valid/
        );
    });

    it("applies the model's field defaults to missing values", async () => {
        const entry = await create({ values: {} });

        expect(entry.values).toEqual({ title: undefined });
    });
});
