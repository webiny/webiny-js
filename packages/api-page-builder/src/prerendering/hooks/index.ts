import afterMenuUpdate from "./afterMenuUpdate";
import afterPageBlockUpdate from "./afterPageBlockUpdate";
import afterPageDelete from "./afterPageDelete";
import afterPagePublish from "./afterPagePublish";
import afterPageUnpublish from "./afterPageUnpublish";
import afterSettingsUpdate from "./afterSettingsUpdate";
import afterFormUpdate from "./afterFormUpdate";
import afterFormDeletetion from "./afterFormDeletetion";
import afterFormRevisionDelete from "./afterFormRevisionDelete";
import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "@webiny/api-form-builder/types";

export default (): ContextPlugin<PbContext & FormBuilderContext>[] => {
    return [
        afterMenuUpdate(),
        afterPageBlockUpdate(),
        afterPageDelete(),
        afterPagePublish(),
        afterPageUnpublish(),
        afterSettingsUpdate(),
        afterFormUpdate(),
        afterFormDeletetion(),
        afterFormRevisionDelete()
    ];
};
