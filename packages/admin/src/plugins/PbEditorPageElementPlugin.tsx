import React from "react";
import type { PbEditorPageElementPlugin as LegacyPbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type PbEditorPageElementPluginProps = Omit<LegacyPbEditorPageElementPlugin, "type">;

export const PbEditorPageElementPlugin = createLegacyPlugin<
    PbEditorPageElementPluginProps,
    LegacyPbEditorPageElementPlugin
>(props => {
    return {
        type: "pb-editor-page-element",
        ...props
    };
});
