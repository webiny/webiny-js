import { CmsModelFieldToStoragePlugin } from "~/types";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-default",
    fieldType: "*",
    async fromStorage({ fieldPath, getValue }) {
        return {
            values: { [fieldPath]: getValue(fieldPath) }
        };
    },
    async toStorage({ fieldPath, getValue }) {
        return {
            values: { [fieldPath]: getValue(fieldPath) }
        };
    }
});
