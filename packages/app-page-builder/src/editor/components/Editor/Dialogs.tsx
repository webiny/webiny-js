import React, { ReactElement } from "react";
import styled from "@emotion/styled";
import { plugins } from "@webiny/plugins";
import { PbEditorToolbarBottomPlugin, PbEditorToolbarTopPlugin } from "../../../types";

const DialogsContainer = styled("div")({
    position: "fixed",
    zIndex: 5
});

const Dialogs = () => {
    const actions = [
        ...plugins.byType<PbEditorToolbarTopPlugin>("pb-editor-toolbar-top"),
        ...plugins.byType<PbEditorToolbarBottomPlugin>("pb-editor-toolbar-bottom")
    ];

    return (
        <DialogsContainer data-type={"dialogs"}>
            {actions
                .filter(plugin => typeof plugin.renderDialog === "function")
                .map(plugin =>
                    /**
                     * We can safely cast because undefined ones were filtered
                     */
                    React.cloneElement((plugin.renderDialog as () => ReactElement)(), {
                        key: plugin.name
                    })
                )}
        </DialogsContainer>
    );
};

export default React.memo(Dialogs);
