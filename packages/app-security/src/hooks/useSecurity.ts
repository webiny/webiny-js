import { useContext } from "react";
import { SecurityContext } from "~/contexts/Security";

export function useSecurity() {
    return useContext(SecurityContext);
}
