import gql from "graphql-tag";
import { useQuery } from "@apollo/react-hooks";
import { Tenant, type TenantDto } from "../shared/Tenant.js";

const GET_CURRENT_TENANT = gql`
    query GetCurrentTenant {
        tenantManager {
            getCurrentTenant {
                data {
                    id
                    values
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface GetCurrentTenantResponse {
    tenantManager: {
        getCurrentTenant:
            | {
                  data: TenantDto;
                  error: null;
              }
            | {
                  data: null;
                  error: {
                      code: string;
                      message: string;
                      data: Record<string, any>;
                  };
              };
    };
}

export function useCurrentTenantQuery() {
    const query = useQuery<GetCurrentTenantResponse>(GET_CURRENT_TENANT);

    const { data, error, loading } = query;

    if (loading) {
        return {
            tenant: undefined,
            error: undefined,
            loading: true
        };
    }

    if (!data) {
        return {
            tenant: undefined,
            error: error,
            loading: false
        };
    }

    const response = data.tenantManager.getCurrentTenant;

    if (!response.data) {
        return {
            tenant: undefined,
            error: response.error,
            loading: false
        };
    }

    return {
        tenant: Tenant.from(response.data),
        error: response.error,
        loading
    };
}
