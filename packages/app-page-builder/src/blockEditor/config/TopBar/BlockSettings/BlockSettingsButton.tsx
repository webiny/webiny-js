import React, { useCallback, useState } from "react";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as SettingsIcon } from "./settings.svg";
import { BlockSettingsModal } from "./BlockSettingsModal";

export const BlockSettingsButton = () => {
    const [open, setState] = useState(false);

    const onClickHandler = useCallback(() => {
        setState(true);
    }, []);

    const onClose = useCallback(() => {
        setState(false);
    }, []);

    return (
        <>
            <IconButton onClick={onClickHandler} icon={<SettingsIcon />} />
            <BlockSettingsModal open={open} onClose={onClose} />
        </>
    );
};
