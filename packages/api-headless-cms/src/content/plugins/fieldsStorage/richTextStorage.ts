import { CmsModelFieldToStoragePlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-rich-text",
    fieldType: "rich-text",
    fromStorage(args) {
        // https://www.npmjs.com/package/jsonpack
        // { compression: "jsonpack", value: "....." }
        return args.value;
    },
    toStorage(args): any {
        return args.value;
    }
});
