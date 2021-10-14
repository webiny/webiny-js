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

export const withTenant = (BaseAuthentication, { getIdentityData }) => {
    const Authentication = ({ children }) => {
        const { tenant, setTenant } = useTenancy();

        const getIdentityWithTenant = async params => {
            if (tenant) {
                return getIdentityData(params);
            }

            // Get default tenant
            const response = await params.client.query({
                query: GET_DEFAULT_TENANT,
                context: { headers: { "x-tenant": tenant || "root" } }
            });

            const defaultTenantId = response.data.tenancy.getDefaultTenant.data.id;

            setTenant(defaultTenantId);

            return await new Promise(resolve => {
                setTimeout(() => {
                    resolve(getIdentityData(params));
                }, 1000);
            });
        };

        return (
            <BaseAuthentication getIdentityData={getIdentityWithTenant}>
                {children}
            </BaseAuthentication>
        );
    };

    return Authentication;
};
