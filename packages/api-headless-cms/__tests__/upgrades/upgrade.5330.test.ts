import { useGraphQLHandler } from "../utils/useGraphQLHandler";
import models from "../contentAPI/mocks/contentModels";
import { CmsModelField } from "~/types";

const clearStorageId = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.map(field => {
        const settings = {
            ...(field.settings || {})
        };
        if (settings.fields && Array.isArray(settings.fields) === true) {
            settings.fields = clearStorageId(settings.fields);
        }
        const result: CmsModelField = {
            ...field,
            storageId: "",
            settings
        };
        // @ts-ignore
        delete result["storageId"];
        return result;
    });
};

const expectModelFields = (fields: CmsModelField[]): Partial<CmsModelField>[] => {
    return fields.map(field => {
        const result: Partial<CmsModelField> = {
            id: field.id,
            fieldId: field.fieldId,
            storageId: null as any
        };
        if (field.settings?.fields) {
            const settings: any = {
                ...(field.settings || {})
            };
            if (settings.fields && Array.isArray(settings.fields) === true) {
                settings.fields = expectModelFields(settings.fields);
            }
            result.settings = {
                ...settings
            };
        }
        return result;
    });
};

describe("upgrade for 5.33.0", () => {
    const { storageOperations, listContentModelsQuery } = useGraphQLHandler({
        path: "manage/en-US"
    });

    it("should add storageId to all the models", async () => {
        const modelsToInsert = models.map(model => {
            return {
                ...model,
                fields: clearStorageId(model.fields),
                createdBy: {
                    id: "adminId",
                    type: "admin",
                    displayName: "Admin"
                }
            };
        });

        for (const model of modelsToInsert) {
            try {
                await storageOperations.models.create({
                    model
                });
            } catch (ex) {
                console.log(ex.message);
                return;
            }
        }

        const [listContentModelsResult] = await listContentModelsQuery();

        const expectedModels = models.map(model => {
            return {
                modelId: model.modelId,
                fields: expectModelFields(model.fields)
            };
        });

        expect(listContentModelsResult).toMatchObject({
            data: {
                listContentModels: {
                    data: expectedModels,
                    error: null
                }
            }
        });
    });
});
