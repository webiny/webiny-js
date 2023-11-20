import { PbContext } from "@webiny/api-page-builder/types";
import { ContextPlugin } from "@webiny/api";
import { FormBuilderContext } from "~/types";

import afterFormPublish from "./afterFormPublish";
import afterFormDelete from "./afterFormDelete";
import afterFormRevisionDelete from "./afterFormRevisionDelete";

export default (): ContextPlugin<FormBuilderContext & PbContext>[] => {
    return [afterFormPublish(), afterFormDelete(), afterFormRevisionDelete()];
};
