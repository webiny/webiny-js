import { useContext } from "react";
import { TenancyContext, TenancyContextValue } from "../contexts/Tenancy";

export const useTenancy = () => {
    return useContext<TenancyContextValue>(TenancyContext);
};
