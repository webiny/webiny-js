import get from "lodash/get";
import { useQuery } from "@apollo/react-hooks";
import { useTenancy } from "@webiny/app-tenancy";
import { GET_TENANT } from "~/graphql";

export function useCurrentTenant() {
    const { tenant } = useTenancy();
    const { data, loading } = useQuery(GET_TENANT, { variables: { id: tenant } });

    return {
        loading,
        tenant: loading ? null : get(data, "tenancy.getTenant.data")
    };
}
