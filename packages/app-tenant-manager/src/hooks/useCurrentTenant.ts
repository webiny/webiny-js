import get from "lodash/get.js";
import { useQuery } from "@apollo/react-hooks";
import { useTenancy } from "@webiny/app-admin";
import type { GetTenantQueryResponse, GetTenantQueryVariables } from "~/graphql/index.js";
import { GET_TENANT } from "~/graphql/index.js";
import type { TenantItem } from "~/types.js";

interface UseCurrentTenant {
    tenant: TenantItem | null;
    loading: boolean;
}
export function useCurrentTenant(): UseCurrentTenant {
    const { tenant } = useTenancy();
    const { data, loading } = useQuery<GetTenantQueryResponse, GetTenantQueryVariables>(
        GET_TENANT,
        {
            variables: {
                id: tenant as string
            },
            skip: !tenant
        }
    );

    return {
        loading,
        tenant: loading ? null : (get(data, "tenancy.getTenant.data") as unknown as TenantItem)
    };
}
