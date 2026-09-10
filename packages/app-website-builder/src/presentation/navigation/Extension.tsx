import React from "react";
import { AdminConfig, useToggler } from "@webiny/app-admin";
import { ReactComponent as IntegrationIcon } from "@webiny/icons/integration_instructions.svg";
import { StarterKitConfigDialog } from "./StarterKitConfigDialog.js";

const { Menu } = AdminConfig;

export const Extension = React.memo(() => {
    const { on, toggleOn, toggleOff } = useToggler(false);

    return (
        <>
            <StarterKitConfigDialog open={on} onClose={toggleOff} />
            <Menu
                name={"dev-tools.frontend"}
                parent={"dev-tools"}
                element={
                    <Menu.Item
                        text={"Configure Frontend"}
                        onClick={toggleOn}
                        icon={
                            <Menu.Link.Icon
                                label={"Configure Integrations"}
                                element={<IntegrationIcon />}
                            />
                        }
                    />
                }
            />
        </>
    );
});

Extension.displayName = "NavigationExtension";
