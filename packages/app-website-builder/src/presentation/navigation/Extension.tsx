import React from "react";
import { AdminConfig, useToggler } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { NexjsConfigDialog } from "./NextjsConfig/NextjsConfigDialog.js";

const { Menu } = AdminConfig;

export const Extension = React.memo(() => {
    const { on, toggleOn, toggleOff } = useToggler(false);

    return (
        <>
            <NexjsConfigDialog open={on} onClose={toggleOff} />
            <Menu.Support
                name={"wb.nextjs"}
                element={
                    <Menu.Support.Item
                        text={"Configure Next.js"}
                        onClick={toggleOn}
                        icon={<SettingsIcon />}
                        className={"cursor-pointer"}
                    />
                }
            />
        </>
    );
});

Extension.displayName = "NavigationExtension";
