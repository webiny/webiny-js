import { useContext } from "react";
import { FormContextProvider, FormsContext } from "./FormsContext";

export function useForms(): FormContextProvider {
    return useContext(FormsContext);
}
