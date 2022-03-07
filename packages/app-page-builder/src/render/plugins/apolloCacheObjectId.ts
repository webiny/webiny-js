import {
    ApolloCacheObjectIdPlugin,
    ApolloCacheObject
} from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

export interface PageBuilderObject extends ApolloCacheObject {
    id: string;
}

export default new ApolloCacheObjectIdPlugin<PageBuilderObject>((obj): string | null => {
    if (obj.__typename === "PbPage" || obj.__typename === "PbPageListItem") {
        return obj.__typename + obj.id;
    }
    return null;
});
