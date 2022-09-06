import {
    ApolloCacheObjectIdPlugin,
    ApolloCacheObject
} from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

export interface PageBuilderObject extends ApolloCacheObject {
    id: string;
}

export default new ApolloCacheObjectIdPlugin<PageBuilderObject>(obj => {
    if (obj.__typename === "PbPage" || obj.__typename === "PbPageListItem") {
        return obj.__typename + obj.id;
    }

    return undefined;
});
