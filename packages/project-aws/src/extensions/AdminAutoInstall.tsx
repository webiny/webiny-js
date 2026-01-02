import React from "react";
import { Infra } from "@webiny/project-aws/index.js";

export interface AutoInstallAdminUserProps {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface AutoInstallProps {
    adminUser: AutoInstallAdminUserProps;
}

export const AutoInstall = (props: AutoInstallProps) => {
    return <Infra.Admin.AutoInstall.ReactComponent adminUser={props.adminUser} />;
};
