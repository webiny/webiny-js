import React from "react";
import { IconButton } from "webiny-ui/Button";
import { useFormEditor } from "./Context";
import { ReactComponent as SettingsIcon } from "./icons/settings.svg";

export const FormSettingsButton = () => {
    const { showSettings } = useFormEditor();
    return <IconButton onClick={showSettings} icon={<SettingsIcon />} />;
};
