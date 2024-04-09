import React, { useState, useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/round/settings.svg";
import TemplateSettingsModal from "./TemplateSettingsModal";

export const TemplateSettingsButton = () => {
    const [open, setOpen] = useState(false);

    const onClick = useCallback(() => {
        setOpen(true);
    }, []);

    const onClose = useCallback(() => {
        setOpen(false);
    }, []);

    return (
        <>
            <IconButton onClick={onClick} icon={<SettingsIcon />} />
            <TemplateSettingsModal open={open} onClose={onClose} />
        </>
    );
};
