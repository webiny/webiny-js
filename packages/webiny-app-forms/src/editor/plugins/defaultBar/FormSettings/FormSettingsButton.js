// @flow
// $FlowFixMe
import React, { useState, useCallback } from "react";
import { IconButton } from "webiny-ui/Button";
import FormSettings from "./FormSettings";

import { ReactComponent as SettingsIcon } from "./../icons/settings.svg";

const FormSettingsButton = () => {
    const [opened, setOpened] = useState(false);
    const open = useCallback(() => setOpened(true), []);
    const close = useCallback(() => setOpened(false), []);

    return (
        <>
            <IconButton onClick={open} icon={<SettingsIcon />} />
            {opened && <FormSettings onExited={close} />}
        </>
    );
};

export default FormSettingsButton;
