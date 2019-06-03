import React, { useState, useCallback } from "react";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as SettingsIcon } from "./../icons/settings.svg";
import { FormSettingsDialog } from "./FormSettingsDialog";

export const FormSettingsButton = () => {
    const [opened, setOpened] = useState(false);

    const open = useCallback(() => setOpened(true), []);
    const close = useCallback(() => setOpened(false), []);

    return (
        <>
            <IconButton onClick={open} icon={<SettingsIcon />} />
            <FormSettingsDialog open={opened} onClose={close} />
        </>
    );
};
