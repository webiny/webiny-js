import React, { useState, useCallback } from "react";
import FormSettings from "./FormSettings.js";

import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { IconButton, Tooltip } from "@webiny/admin-ui";

const FormSettingsButton = () => {
    const [opened, setOpened] = useState(false);
    const open = useCallback(() => setOpened(true), []);
    const close = useCallback(() => setOpened(false), []);

    return (
        <>
            <Tooltip
                content={"View content model settings"}
                side={"bottom"}
                trigger={<IconButton onClick={open} icon={<SettingsIcon />} variant={"ghost"} />}
            />
            <FormSettings open={opened} onClose={close} />
        </>
    );
};

export default FormSettingsButton;
