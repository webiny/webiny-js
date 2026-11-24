import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { LoginTenantPicker } from "@webiny/app-admin/presentation/security/components/LoginTenantPicker.js";
import { View } from "./View.js";
import type { SelectTenantVM } from "~/admin/presentation/Cognito/abstractions.js";

export interface SelectTenantProps {
    vm: SelectTenantVM;
    onSelect: (tenantId: string) => void;
    onSignOut: () => void;
}

export const SelectTenant = makeDecoratable("CognitoSelectTenant", (props: SelectTenantProps) => {
    const { vm, onSelect, onSignOut } = props;

    return (
        <View.Container>
            <View.Content>
                <LoginTenantPicker tenants={vm.tenants} onSelect={onSelect} onSignOut={onSignOut} />
            </View.Content>
        </View.Container>
    );
});
