import React, { useCallback, useContext } from "react";
import { IconButton } from "webiny-ui/Button";
import { FormEditorContext } from "./context";
import { ReactComponent as SettingsIcon } from "./icons/settings.svg";

export const FormSettingsButton = () => {
    const { setFormState } = useContext(FormEditorContext);
    const showSettings = useCallback(() => setFormState({ showSettings: true }));

    return <IconButton onClick={showSettings} icon={<SettingsIcon />} />;
};
