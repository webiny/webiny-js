import React from "react";
import { AdminConfig, useDialogs } from "@webiny/app-admin";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { NextjsConfiguration } from "./NextjConfiguration.js";

const { Menu } = AdminConfig;

export const ConfigureNextjs = () => {
    const { showDialog } = useDialogs();

    const onClick = () => {
        showDialog({
            size: "xl",
            title: "Configure Next.js",
            content: <NextjsConfiguration />,
            acceptLabel: "Close",
            cancelLabel: null
        });
    };

    return (
        <Menu.Support
            name={"wb.nextjs"}
            element={
                <Menu.Support.Item
                    text={"Configure Next.js"}
                    onClick={onClick}
                    icon={<SettingsIcon />}
                    className={"cursor-pointer"}
                />
            }
        />
    );
};
