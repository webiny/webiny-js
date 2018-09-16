import React from "react";
import styled from "react-emotion";
import { getPlugins } from "webiny-app/plugins";

const DialogsContainer = styled("div")({
    position: "fixed",
    zIndex: 5
});

const Dialogs = () => {
    const actions = [...getPlugins("cms-toolbar-top"), ...getPlugins("cms-toolbar-bottom")];

    return (
        <DialogsContainer data-type={"dialogs"}>
            {actions.map(
                plugin =>
                    typeof plugin.renderDialog === "function"
                        ? React.cloneElement(plugin.renderDialog(), { key: plugin.name })
                        : null
            )}
        </DialogsContainer>
    );
};

export default Dialogs;
