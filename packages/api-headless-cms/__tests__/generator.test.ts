import fs from "fs";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { createCmsGroup, createCmsModel } from "~/plugins";

const createModelsAndGroups = () => {
    const data = {
        groups: [
            {
                id: "other",
                name: "Other",
                slug: "other",
                description: "Other Models",
                icon: "fas/th-list"
            }
        ],
        models: [
            {
                modelId: "tag",
                name: "Tags",
                group: "other",
                description: "",
                singularApiName: "Tag",
                pluralApiName: "Tags",
                fields: [
                    {
                        id: "tagName",
                        fieldId: "tagName",
                        type: "text",
                        label: "Name",
                        renderer: { name: "text-input" },
                        validation: [
                            { name: "required", message: "Name is required." },
                            { name: "unique", message: "Name must be unique." }
                        ],
                        storageId: "text@tagName"
                    },
                    {
                        id: "tagSlug",
                        fieldId: "tagSlug",
                        type: "text",
                        label: "Slug",
                        renderer: { name: "dynamic-slug-input" },
                        validation: [
                            { name: "required", message: "Slug is required." },
                            { name: "unique", message: "Slug must be unique." }
                        ],
                        storageId: "text@tagSlug"
                    }
                ],
                layout: [["tagName"], ["tagSlug"]],
                titleFieldId: "tagName"
            }
        ]
    };

    return [
        ...data.groups.map(group => {
            return createCmsGroup(group);
        }),
        ...data.models.map(model => {
            return createCmsModel({
                ...model,
                noValidate: true,
                group: {
                    id: model.group,
                    name: model.group
                }
            });
        })
    ];
};

describe("schema typescript generator", () => {
    // DO NOT PUSH WITHOUT SKIP
    it.skip("should generate schema", async () => {
        const { invoke } = useGraphQLHandler({
            plugins: [createModelsAndGroups()]
        });

        const response: any = await invoke({
            httpMethod: "GET",
            path: "/cms/ts/manage/en-US",
            headers: {
                "x-tenant": "root"
            },
            getResponse: response => {
                return response;
            }
        });

        fs.writeFileSync(__dirname + "/generated.ts", response.body, "utf-8");

        expect(response.body).not.toEqual(null);
    });
});
