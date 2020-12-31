import { CmsModelFieldToStoragePlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-rich-text",
    fieldType: "rich-text",
    fromStorage(args) {
        return args.value;
    },
    toStorage(args): any {
        return args.value;
    }
});
