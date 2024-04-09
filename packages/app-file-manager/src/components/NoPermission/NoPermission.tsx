import React from "react";
import { i18n } from "@webiny/app/i18n";
import { Icon } from "@webiny/ui/Icon";

import {
    NoPermissionBody,
    NoPermissionIcon,
    NoPermissionInner,
    NoPermissionOuter,
    NoPermissionTitle,
    NoPermissionWrapper
} from "./styled";

const t = i18n.ns("app-admin/file-manager/components/no-permission");

export const NoPermission = () => {
    return (
        <NoPermissionWrapper>
            <NoPermissionOuter>
                <NoPermissionInner>
                    <Icon icon={<NoPermissionIcon />} />
                    <NoPermissionTitle use={"headline6"}>{t`Permission needed`}</NoPermissionTitle>
                    <NoPermissionBody use={"body2"}>
                        {t`You're missing required permission to access files. Please contact the administrator.`}
                    </NoPermissionBody>
                </NoPermissionInner>
            </NoPermissionOuter>
        </NoPermissionWrapper>
    );
};
