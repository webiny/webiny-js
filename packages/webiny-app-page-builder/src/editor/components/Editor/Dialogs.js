// @flow
import React from "react";
import { pure } from "recompose";
import styled from "react-emotion";
import { getPlugins } from "webiny-plugins";

const DialogsContainer = styled("div")({
    position: "fixed",
    zIndex: 5
});

const Dialogs = pure(() => {
    const actions = [...getPlugins("pb-editor-toolbar-top"), ...getPlugins("pb-editor-toolbar-bottom")];

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
