import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { LoginNoTenantAccess } from "@webiny/app-admin/presentation/security/components/LoginNoTenantAccess.js";
import { View } from "./View.js";

export interface NoTenantAccessProps {
    onSignOut: () => void;
}

export const NoTenantAccess = makeDecoratable(
    "CognitoNoTenantAccess",
    (props: NoTenantAccessProps) => {
        return (
            <View.Container>
                <View.Content>
                    <LoginNoTenantAccess onSignOut={props.onSignOut} />
                </View.Content>
            </View.Container>
        );
    }
);
