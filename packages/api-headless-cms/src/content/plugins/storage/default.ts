import { CmsModelFieldToStoragePlugin } from "~/types";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-default",
    fieldType: "*",
    async fromStorage({ value }) {
        return value;
    },
    async toStorage({ value }) {
        return value;
    }
});
