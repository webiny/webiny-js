import { useContext } from "react";
import { TenancyContext, TenancyContextValue } from "~/base/providers/TenancyProvider";

export function useTenancy() {
    return useContext<TenancyContextValue>(TenancyContext);
}
