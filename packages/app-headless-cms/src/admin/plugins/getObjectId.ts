import { ApolloCacheObjectIdPlugin } from "@webiny/app";

export default new ApolloCacheObjectIdPlugin(obj => {
    switch (obj.__typename) {
        case "CmsContentModel":
            return `${obj.__typename}:${obj.modelId}`;
        default:
            return undefined;
    }
});
