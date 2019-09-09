import { useContext } from "react";
import { SecurityContext } from "../contexts/Security";

export const useSecurity = () => {
    return useContext(SecurityContext);
};
