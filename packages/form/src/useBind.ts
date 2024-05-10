import { useEffect } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import lodashGet from "lodash/get";
import { BindComponentProps, UseBindHook } from "~/types";
import { useBindPrefix } from "~/BindPrefix";
import { useForm } from "./FormContext";

export type UseBind = (props: BindComponentProps) => UseBindHook;

export const useBind = makeDecoratable((props: BindComponentProps): UseBindHook => {
    const form = useForm();
    const bindPrefix = useBindPrefix();

    const bindName = [bindPrefix, props.name].filter(Boolean).join(".");

    useEffect(() => {
        if (props.defaultValue !== undefined && lodashGet(form.data, bindName) === undefined) {
            form.setValue(bindName, props.defaultValue);
        }

        return () => {
            form.unregisterField(props.name);
        }
    }, []);

    return form.registerField({ ...props, name: bindName });
});
