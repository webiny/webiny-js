import React from "react";
import { AdminConfig, useToggler } from "@webiny/app-admin";
import { NexjsConfigDialog } from "./NextjsConfig/NextjsConfigDialog.js";

const { Menu } = AdminConfig;

export const Extension = React.memo(() => {
    const { on, toggleOn, toggleOff } = useToggler(false);

    return (
        <>
            <NexjsConfigDialog open={on} onClose={toggleOff} />
            <Menu
                name={"wb.nextjs"}
                parent={"wb"}
                pin={"end"}
                element={<Menu.Item text={"Configure Starter Kit"} onClick={toggleOn} />}
            />
        </>
    );
});

Extension.displayName = "NavigationExtension";
