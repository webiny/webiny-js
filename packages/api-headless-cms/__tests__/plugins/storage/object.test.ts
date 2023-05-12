import { createObjectStorageTransform } from "~/storage/object";
import { createStoragePluginsContainer } from "./container";
import { StorageTransformPlugin } from "~/plugins";
import { createObjectMockModel } from "./object/model";
import { CmsModelField } from "~/types";

const container = createStoragePluginsContainer();
const plugins = container.byType<StorageTransformPlugin>(StorageTransformPlugin.type);

const defaultPlugin = plugins.find(p => p.fieldType === "*");

const getStoragePlugin = (fieldType: string) => {
    const plugin = plugins.find(p => p.fieldType === fieldType);
    if (plugin) {
        return plugin;
    } else if (defaultPlugin) {
        return defaultPlugin;
    }
    throw new Error(`Missing plugin for type "${fieldType}".`);
};

describe("object storage transform", () => {
    it("should transform object data to storage", async () => {
        const plugin = createObjectStorageTransform();
        const model = createObjectMockModel();
        const field = model.fields.find(f => f.fieldId === "objectFieldId") as CmsModelField;

        const result = await plugin.toStorage({
            value: {
                titleFieldId: "Some title",
                dateFieldId: "2022-09-01",
                dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"]
            },
            plugins: container,
            field,
            model,
            getStoragePlugin
        });

        expect(result).toEqual({
            titleFieldId: "Some title",
            dateFieldId: "2022-09-01",
            dateMultipleFieldId: ["2022-09-02", "2022-09-03", "2022-09-04"]
        });
    });
});
