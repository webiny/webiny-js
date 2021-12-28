import React from "react";
import gql from "graphql-tag";
import { Extensions } from "@webiny/app-admin/";
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
        <Extensions>
            <AddTenantFormField querySelection={selection} element={<Domains />} />
        </Extensions>
    );
};
