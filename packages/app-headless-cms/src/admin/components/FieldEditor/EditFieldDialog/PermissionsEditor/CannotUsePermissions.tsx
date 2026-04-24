import React from "react";
import { Alert } from "@webiny/admin-ui";

export const CannotUsePermissions = () => {
    return (
        <Alert title={"Field Permissions feature is not activated"} type={"warning"}>
            <strong>Field Permissions</strong> feature is not activated.
            <br />
            <br />
            To learn more, please visit the official&nbsp;
            <a href={"https://webiny.link/aacl"} target={"_blank"} rel={"noreferrer"}>
                documentation
            </a>
            .
        </Alert>
    );
};
