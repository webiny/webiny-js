import React, { useState, useCallback } from "react";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/round/settings.svg";
import { IconButton } from "@webiny/ui/Button";
import { createComponentPlugin } from "@webiny/react-composition";
import { ModelSettings } from "./ModelSettings";
import { Editor } from "~/modelEditor";

export const ModelSettingsButton = createComponentPlugin(Editor.Header.RightSection, Original => {
    return function RightSection() {
        const [opened, setOpened] = useState(false);
        const open = useCallback(() => setOpened(true), []);
        const close = useCallback(() => setOpened(false), []);

        return (
            <>
                <Original />
                <IconButton onClick={open} icon={<SettingsIcon />} />
                {opened && <ModelSettings onExited={close} />}
            </>
        );
    };
});
