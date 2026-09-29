import { beforeEach, describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler.js";
import { createDefaultGroup } from "~tests/__helpers/groups/defaultGroup.js";
import { createModelPlugin } from "~/index.js";
import type { CmsContext, CmsModel, CmsModelField } from "~/types/index.js";

const MODEL_ID = "productWithNestedSearchableJson";

interface IProductValues {
    name: string;
    details: {
        label: string;
        data: Record<string, any>;
    };
    variants: {
        label: string;
        data: Record<string, any>;
    }[];
}

const createNestedFields = (prefix: string): CmsModelField[] => {
    return [
        {
            id: `${prefix}Label`,
            storageId: "text@label",
            fieldId: "label",
            type: "text",
            label: "Label",
            validation: [],
            listValidation: []
        },
        {
            id: `${prefix}Data`,
            storageId: "searchable-json@data",
            fieldId: "data",
            type: "searchable-json",
            label: "Data",
            validation: [],
            listValidation: []
        }
    ];
};

const createProductModel = () => {
    const group = createDefaultGroup().contentModelGroup;

    return createModelPlugin({
        modelId: MODEL_ID,
        name: "Product with nested Searchable JSON",
        titleFieldId: "name",
        description: "Product model with searchable-json fields inside object fields.",
        layout: [["name"], ["details"], ["variants"]],
        fields: [
            {
                id: "name",
                storageId: "text@name",
                fieldId: "name",
                type: "text",
                label: "Name",
                validation: [],
                listValidation: []
            },
            {
                id: "details",
                storageId: "object@details",
                fieldId: "details",
                type: "object",
                label: "Details",
                validation: [],
                listValidation: [],
                settings: {
                    fields: createNestedFields("details"),
                    layout: [["detailsLabel"], ["detailsData"]]
                }
            },
            {
                id: "variants",
                storageId: "object@variants",
                fieldId: "variants",
                type: "object",
                label: "Variants",
                validation: [],
                listValidation: [],
                list: true,
                settings: {
                    fields: createNestedFields("variants"),
                    layout: [["variantsLabel"], ["variantsData"]]
                }
            }
        ],
        group: group.id,
        icon: null
    });
};

/**
 * Searchable-json fields can live inside object fields (single and multiple values).
 * Full-text search must target them via their full storage path, including the parent object fields.
 * Non-text values are added to verify those do not break the search.
 */
const summerValues: IProductValues = {
    name: "Beach towel",
    details: {
        label: "Cotton fabric",
        data: {
            season: "Summer",
            activeTo: "2026-08-31T23:59:59.000Z",
            priority: 1,
            active: true,
            origin: {
                country: "Portugal",
                certified: true
            }
        }
    },
    variants: [
        {
            label: "Turquoise variant",
            data: {
                pattern: "Striped",
                stock: 10,
                available: true,
                restockOn: "2026-07-01T00:00:00.000Z"
            }
        }
    ]
};

const winterValues: IProductValues = {
    name: "Wool scarf",
    details: {
        label: "Merino wool",
        data: {
            season: "Winter",
            activeTo: "2027-02-28T23:59:59.000Z",
            priority: 2,
            active: false,
            origin: {
                country: "Norway",
                certified: false
            }
        }
    },
    variants: [
        {
            label: "Crimson variant",
            data: {
                pattern: "Checkered",
                stock: 5,
                available: false,
                restockOn: "2026-12-01T00:00:00.000Z"
            }
        }
    ]
};

describe("searchable-json field inside object fields - full text search", () => {
    let context: CmsContext;
    let model: CmsModel;

    beforeEach(async () => {
        const path = "manage";
        const { handler, tenant } = useHandler({
            path,
            plugins: [createDefaultGroup(), createProductModel()]
        });
        context = await handler({
            path,
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });

        model = await context.cms.getModel(MODEL_ID);

        await context.cms.createEntry<IProductValues>(model, {
            values: summerValues
        });
        await context.cms.createEntry<IProductValues>(model, {
            values: winterValues
        });
    });

    const search = async (term: string) => {
        const [entries] = await context.cms.listLatestEntries<IProductValues>(model, {
            search: term
        });
        return entries.map(entry => entry.values.name).sort();
    };

    it("should find entries by the title field", async () => {
        expect(await search("scarf")).toEqual(["Wool scarf"]);
    });

    it("should find entries by a text field in the object field", async () => {
        expect(await search("Merino")).toEqual(["Wool scarf"]);
    });

    it("should find entries by a searchable-json value in the object field", async () => {
        expect(await search("Summer")).toEqual(["Beach towel"]);
    });

    it("should find entries by a nested searchable-json value in the object field", async () => {
        expect(await search("Norway")).toEqual(["Wool scarf"]);
    });

    it("should find entries by a text field in the multiple values object field", async () => {
        expect(await search("Turquoise")).toEqual(["Beach towel"]);
    });

    it("should find entries by a searchable-json value in the multiple values object field", async () => {
        expect(await search("Checkered")).toEqual(["Wool scarf"]);
    });

    it("should find nothing when term does not match", async () => {
        expect(await search("Autumn")).toEqual([]);
    });
});
