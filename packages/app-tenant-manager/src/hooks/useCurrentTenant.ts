import get from "lodash/get";
import { useQuery } from "@apollo/react-hooks";
import { useTenancy } from "@webiny/app-tenancy";
import { GET_TENANT, GetTenantQueryResponse, GetTenantQueryVariables } from "~/graphql";
import { TenantItem } from "~/types";

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
