import React from "react";
import type { PbEditorPageElementPlugin as LegacyPbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type EditorPageElementProps = Omit<LegacyPbEditorPageElementPlugin, "type">;

export const EditorPageElement = createLegacyPlugin<
    EditorPageElementProps,
    LegacyPbEditorPageElementPlugin
>(props => {
    return {
        type: "pb-editor-page-element",
        ...props
    };
});
