import React, { useContext } from "react";
import { FormAPI, GenericFormData } from "~/types";

export const FormContext = React.createContext<FormAPI | undefined>(undefined);

export const useForm = <T extends GenericFormData = GenericFormData>() => {
    const context = useContext(FormContext) as FormAPI<T>;
    if (!context) {
        throw new Error("Missing Form component in the component hierarchy!");
    }
    return context;
};
