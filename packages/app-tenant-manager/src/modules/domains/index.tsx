import React from "react";
import gql from "graphql-tag";
import { Plugins } from "@webiny/app-admin";
import { Domains } from "~/components/Domains";
import { AddTenantFormField } from "~/components/AddTenantFormField";

export const DomainsModule = () => {
    const selection = gql`
        {
            settings {
                domains {
                    fqdn
                }
            }
        }
    `;
    return (
        <Plugins>
            <AddTenantFormField querySelection={selection} element={<Domains />} />
        </Plugins>
    );
};
