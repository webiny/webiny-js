import { useContext } from "react";
import { TenancyContext, TenancyContextValue } from "~/contexts/Tenancy";

export function useTenancy() {
    return useContext<TenancyContextValue>(TenancyContext);
}
