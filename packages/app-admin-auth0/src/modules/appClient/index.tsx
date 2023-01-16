import React, { memo } from "react";
import gql from "graphql-tag";
import { Plugins } from "@webiny/app-admin";
import { AddTenantFormField } from "@webiny/app-tenant-manager";
import { AppClientInput } from "./AppClientInput";

const TenantFormFields = memo(function TenantFormFields() {
    const selection = gql`
        {
            settings {
                appClientId
            }
        }
    `;

    return <AddTenantFormField querySelection={selection} element={<AppClientInput />} />;
});

export const AppClientModule = () => {
    return (
        <Plugins>
            <TenantFormFields />
        </Plugins>
    );
};
