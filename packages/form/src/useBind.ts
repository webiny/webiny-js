import { useEffect, useMemo } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { BindComponentProps, UseBindHook } from "~/types";
import { useBindPrefix } from "~/BindPrefix";
import { useForm } from "./FormContext";

export type UseBind = (props: BindComponentProps) => UseBindHook;

export const useBind = makeDecoratable((props: BindComponentProps): UseBindHook => {
    const form = useForm();
    const bindPrefix = useBindPrefix();

    const bindName = useMemo(() => {
        return [bindPrefix, props.name].filter(Boolean).join(".");
    }, [props.name]);

    const fieldProps = { ...props, name: bindName };

    useEffect(() => {
        form.registerField(fieldProps);

        return () => {
            form.unregisterField(fieldProps.name);
        };
    }, []);

    return form.registerField(fieldProps);
});
