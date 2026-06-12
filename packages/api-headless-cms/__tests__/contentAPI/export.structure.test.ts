import { describe, expect, it } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import type { CmsGroup } from "~tests/types";
import models from "./mocks/contentModels";
import type { CmsModel } from "~/types";
import { createIcon } from "~tests/__helpers/icon.js";

interface JsonResult {
    groups: CmsGroup[];
    models: CmsModel[];
}

const groups: Omit<CmsGroup, "id">[] = [
    {
        icon: createIcon("fas/star"),
        slug: "group-1",
        name: "Group 1",
        description: "Group 1 description"
    },
    {
        icon: createIcon("fas/star"),
        slug: "group-2",
        name: "Group 2",
        description: "Group 2 description"
    }
];

describe("export cms structure", () => {
    const insertGroups = async (mutation: (variables: any) => Promise<any>) => {
        const results: CmsGroup[] = [];
        for (const group of groups) {
            const [result] = await mutation({
                data: group
            });
            results.push(result.data.createContentModelGroup.data);
        }
        return results;
    };

    it("should export all groups and models", async () => {
        const {
            exportStructureQuery,
            createContentModelGroupMutation,
            createContentModelMutation
        } = useGraphQLHandler({
            path: "manage"
        });

        const createdGroups = await insertGroups(createContentModelGroupMutation);

        const modelPromises = models.map(async model => {
            const group = [...createdGroups].sort(() => Math.random() - 0.5).shift();
            const [result] = await createContentModelMutation({
                data: {
                    modelId: model.modelId,
                    name: model.name,
                    group: group!.slug,
                    layout: model.layout,
                    fields: model.fields,
                    titleFieldId: model.titleFieldId,
                    pluralApiName: model.pluralApiName,
                    singularApiName: model.singularApiName,
                    icon: model.icon || createIcon("fa/fas"),
                    description: model.description || ""
                }
            });

            return result.data.createContentModel.data;
        });

        const createdModels = await Promise.all(modelPromises);

        expect(createdModels.length).toBe(models.length);

        const [result] = await exportStructureQuery();

        expect(result).toEqual({
            data: {
                exportStructure: {
                    data: expect.any(String),
                    error: null
                }
            }
        });
        const json = JSON.parse(result.data.exportStructure.data) as JsonResult;
        expect(json.groups.length).toBe(groups.length);
        expect(json.models.length).toBe(models.length);
        expect(json).toMatchObject({
            groups: groups.map(group => {
                return {
                    ...group,
                    id: expect.any(String)
                };
            }),
            models: expect.any(Array)
        });
        for (const model of createdModels) {
            const jsonModel = json.models.find(m => m.modelId === model.modelId) as CmsModel;
            const group = createdGroups.find(g => g.slug === model.group) as CmsGroup;
            expect(jsonModel).toMatchObject({
                modelId: model.modelId,
                name: model.name,
                singularApiName: model.singularApiName,
                pluralApiName: model.pluralApiName,
                description: model.description,
                titleFieldId: model.titleFieldId,
                icon: expect.objectContaining(
                    Object.fromEntries(
                        Object.entries(model.icon ?? {}).filter(([, v]) => v !== undefined)
                    )
                ),
                group: group.slug,
                fields: model.fields,
                layout: model.layout
            });
            expect(jsonModel.imageFieldId).toEqual(model.imageFieldId ?? null);
            expect(jsonModel.descriptionFieldId).toEqual(model.descriptionFieldId ?? null);
        }
    });
});
