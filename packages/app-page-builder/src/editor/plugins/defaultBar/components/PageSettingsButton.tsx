import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { TogglePluginActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "./icons/settings.svg";

const PageSettingsButton = () => {
    const handler = useEventActionHandler();
    const onClickHandler = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-page-settings-bar"
            })
        );
    };
    return <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />;
};

export default React.memo(PageSettingsButton);
