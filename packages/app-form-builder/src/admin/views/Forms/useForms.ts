import { useContext } from "react";
import { FormsContext } from "./FormsContext";

export function useForms() {
    return useContext(FormsContext);
}
