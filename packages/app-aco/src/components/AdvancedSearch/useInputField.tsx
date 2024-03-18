import { createGenericContext } from "@webiny/app-admin";
import { FieldDTO } from "~/components/AdvancedSearch/domain";

export interface InputFieldContext {
    field: FieldDTO;
    name: string;
}

const { Provider, useHook } = createGenericContext<InputFieldContext>("InputFieldContext");

export const useInputField = useHook;
export const InputFieldProvider = Provider;
