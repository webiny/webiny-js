import { useContext } from "react";
import { SecurityContext, SecurityContextValue } from "../contexts/Security";

export const useSecurity = (): SecurityContextValue => {
    return useContext(SecurityContext);
};
