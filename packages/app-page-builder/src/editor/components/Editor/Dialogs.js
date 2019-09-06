// @flow
import React from "react";
import styled from "@emotion/styled";
import { getPlugins } from "@webiny/plugins";

const DialogsContainer = styled("div")({
    position: "fixed",
    zIndex: 5
});

const Dialogs = React.memo(() => {
    const actions = [
        ...getPlugins("pb-editor-toolbar-top"),
        ...getPlugins("pb-editor-toolbar-bottom")
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
});

export default Dialogs;
