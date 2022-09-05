import afterMenuUpdate from "./afterMenuUpdate";
import afterPageDelete from "./afterPageDelete";
import afterPagePublish from "./afterPagePublish";
import afterPageUnpublish from "./afterPageUnpublish";
import afterSettingsUpdate from "./afterSettingsUpdate";
import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";

export default (): ContextPlugin<PbContext>[] => {
    return [
        afterMenuUpdate(),
        afterPageDelete(),
        afterPagePublish(),
        afterPageUnpublish(),
        afterSettingsUpdate()
    ];
};
