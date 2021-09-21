import { ApolloCacheObjectIdPlugin, Object } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

export interface PageBuilderObject extends Object {
    id: string;
}

export default new ApolloCacheObjectIdPlugin<PageBuilderObject>(obj => {
    if (obj.__typename === "PbPage" || obj.__typename === "PbPageListItem") {
        return obj.__typename + obj.id;
    }
});
