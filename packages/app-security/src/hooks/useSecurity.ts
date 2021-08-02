import { useContext } from "react";
import { SecurityContext, SecurityContextValue } from "../contexts/Security";

export type UseSecurity = ReturnType<typeof useSecurity>;

export function useSecurity() {
    return useContext<SecurityContextValue>(SecurityContext);
}
