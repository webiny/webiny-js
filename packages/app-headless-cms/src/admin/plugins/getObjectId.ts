import { CacheGetObjectIdPlugin } from "@webiny/app/types";

const plugin: CacheGetObjectIdPlugin = {
    type: "cache-get-object-id",
    getObjectId(obj) {
        switch (obj.__typename) {
            case "CmsContentModel":
                return obj.modelId;
            default:
                return undefined;
        }
    }
};

export default plugin;
