import afterMenuUpdate from "./afterMenuUpdate";
import afterPageBlockUpdate from "./afterPageBlockUpdate";
import afterPageDelete from "./afterPageDelete";
import afterPagePublish from "./afterPagePublish";
import afterPageUnpublish from "./afterPageUnpublish";
import afterSettingsUpdate from "./afterSettingsUpdate";
import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";

export default (): ContextPlugin<PbContext>[] => {
    return [
        afterMenuUpdate(),
        afterPageBlockUpdate(),
        afterPageDelete(),
        afterPagePublish(),
        afterPageUnpublish(),
        afterSettingsUpdate()
    ];
};
