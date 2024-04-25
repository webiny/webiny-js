import React, { useContext } from "react";
import { FormAPI, GenericFormData } from "~/types";

export const FormContext = React.createContext<FormAPI>(undefined as unknown as FormAPI);

export const useForm = <T extends GenericFormData = GenericFormData>() => {
    return useContext(FormContext) as FormAPI<T>;
};
