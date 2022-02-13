import React from "react";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { TogglePluginActionEvent } from "../../../recoil/actions";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "./icons/settings.svg";

const PageSettingsButton: React.FC = () => {
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
