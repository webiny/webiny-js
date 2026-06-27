import React from "react";
import { AdminConfig, useToggler } from "@webiny/app-admin";
import { StarterKitConfigDialog } from "./StarterKitConfigDialog.js";

const { Menu } = AdminConfig;

export const Extension = React.memo(() => {
    const { on, toggleOn, toggleOff } = useToggler(false);

    return (
        <>
            <StarterKitConfigDialog open={on} onClose={toggleOff} />
            <Menu
                name={"wb.starterKit"}
                parent={"wb"}
                pin={"end"}
                element={<Menu.Item text={"Configure Starter Kit"} onClick={toggleOn} />}
            />
        </>
    );
});

Extension.displayName = "NavigationExtension";
