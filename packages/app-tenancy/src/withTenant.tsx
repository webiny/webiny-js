import React from "react";
import { gql } from "graphql-tag";
import { useTenancy } from "~/hooks/useTenancy";

export const GET_DEFAULT_TENANT = gql`
    query GetDefaultTenant {
        tenancy {
            getDefaultTenant {
                data {
                    id
                    name
                    description
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const withTenant =
    Component =>
    ({ getIdentityData, children }) => {
        const { tenant, setTenant, isMultiTenant } = useTenancy();

        const getIdentityWithTenant = async params => {
            if (tenant || !isMultiTenant) {
                return getIdentityData(params);
            }

            // Get default tenant
            const response = await params.client.query({
                query: GET_DEFAULT_TENANT,
                context: { headers: { "x-tenant": tenant || "root" } }
            });

            const defaultTenantId = response.data.tenancy.getDefaultTenant.data.id;

            setTenant(defaultTenantId);

            return getIdentityData(params);
        };

        return <Component getIdentityData={getIdentityWithTenant}>{children}</Component>;
    };
