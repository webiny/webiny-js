import React from "react";
import { AddMenu } from "@webiny/app-admin";

export const HideMenuItems = AddMenu.createDecorator(Original => {
    const skip = ["github", "documentation", "slack"];

    return function AddMenu(props) {
        if (props.name.startsWith("tenantManager") || skip.includes(props.name)) {
            return null;
        }

        return <Original {...props} />;
    };
});
