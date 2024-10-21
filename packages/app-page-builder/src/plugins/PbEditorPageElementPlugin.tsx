import type { PbEditorPageElementPlugin as BasePbEditorPageElementPlugin } from "~/types";
import { legacyPluginToReactComponent } from "@webiny/app/utils";

export const PbEditorPageElementPlugin = legacyPluginToReactComponent<
    Pick<
        BasePbEditorPageElementPlugin,
        | "elementType"
        | "toolbar"
        | "help"
        | "target"
        | "settings"
        | "create"
        | "render"
        | "canDelete"
        | "canReceiveChildren"
        | "onReceived"
        | "onChildDeleted"
        | "onCreate"
        | "renderElementPreview"
    >
>({
    pluginType: "pb-editor-page-element",
    componentDisplayName: "PbEditorPageElementPlugin"
});
