import React, { useState, useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import FormSettings from "./FormSettings";

import { ReactComponent as SettingsIcon } from "./../icons/settings.svg";

const FormSettingsButton = () => {
    const [opened, setOpened] = useState<boolean>(false);
    const open = useCallback((): void => setOpened(true), []);
    const close = useCallback((): void => setOpened(false), []);

    return (
        <>
            <IconButton onClick={open} icon={<SettingsIcon />} />
            {opened && <FormSettings onExited={close} />}
        </>
    );
};

export default FormSettingsButton;
