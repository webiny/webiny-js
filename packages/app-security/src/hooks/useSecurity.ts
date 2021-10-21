import { useContext } from "react";
import { SecurityContext } from "~/contexts/Security";

export type UseSecurity = ReturnType<typeof useSecurity>;

export function useSecurity() {
    return useContext(SecurityContext);
}
