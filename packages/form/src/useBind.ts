import { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { BindComponentProps, UseBindHook } from "~/types";
import { useBindPrefix } from "~/BindPrefix";
import { useForm } from "./FormContext";

export type UseBind = (props: BindComponentProps) => UseBindHook;

export const useBind = makeDecoratable((props: BindComponentProps): UseBindHook => {
    const form = useForm();
    const bindPrefix = useBindPrefix();

    const bindName = [bindPrefix, props.name].filter(Boolean).join(".");

    useEffect(() => {
        return () => {
            form.unregisterField(props.name);
        };
    }, []);

    return form.registerField({ ...props, name: bindName });
});
