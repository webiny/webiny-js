import { useContext } from "react";
import { SecurityContext, SecurityContextValue } from "../contexts/Security";

export const useSecurity = () => {
    return useContext<SecurityContextValue>(SecurityContext);
};
