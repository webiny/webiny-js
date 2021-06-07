import { useContext } from "react";
import { TenancyContext, TenancyContextValue, Tenant } from "../contexts/Tenancy";

export function useTenancy<TTenant = Tenant>() {
    return useContext<TenancyContextValue<TTenant>>(TenancyContext);
}
