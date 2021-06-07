import { CacheGetObjectIdPlugin } from "@webiny/app/types";

const plugin: CacheGetObjectIdPlugin = {
    type: "cache-get-object-id",
    getObjectId(obj) {
        switch (obj.__typename) {
            case "SecurityGroup":
                return obj.slug;
            case "SecurityUser":
                return obj.login;
            default:
                return undefined;
        }
    }
};

export default plugin;
