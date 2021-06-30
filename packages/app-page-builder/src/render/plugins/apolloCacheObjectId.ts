import { ApolloCacheObjectIdPlugin, Object } from "@webiny/app/plugins/ApolloCacheObjectIdPlugin";

interface PageBuilderObject extends Object {
    id: string;
}

export default new ApolloCacheObjectIdPlugin<PageBuilderObject>(obj => {
    if (obj.__typename === "PbPage" || "PbPageListItem") {
        return obj.__typename + obj.id;
    }
});
