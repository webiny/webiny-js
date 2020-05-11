import React from "react";
import styled from "@emotion/styled";
import { getPlugins } from "@webiny/plugins";
import {
    PbEditorToolbarBottomPlugin,
    PbEditorToolbarTopPlugin
} from "@webiny/app-page-builder/types";

const DialogsContainer = styled("div")({
    position: "fixed",
    zIndex: 5
});

const Dialogs = () => {
    const actions = [
        ...(getPlugins<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top")),
        ...(getPlugins<PbEditorToolbarBottomPlugin>("pb-editor-toolbar-bottom"))
    ];

    return (
        <DialogsContainer data-type={"dialogs"}>
            {actions.map(plugin =>
                typeof plugin.renderDialog === "function"
                    ? React.cloneElement(plugin.renderDialog(), { key: plugin.name })
                    : null
            )}
        </DialogsContainer>
    );
};

export default React.memo(Dialogs);
