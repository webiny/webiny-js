import React from "react";
import { AdminConfig } from "@webiny/app-admin";

const { Menu } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <AdminConfig>
                <Menu
                    parent={"settings.system"}
                    name="aiPowerups"
                    element={
                        <Menu.Item
                            text="AI Powerups"
                            onClick={() => {
                                alert("Open AI Powerups");
                            }}
                        />
                    }
                />
            </AdminConfig>
        </>
    );
};
