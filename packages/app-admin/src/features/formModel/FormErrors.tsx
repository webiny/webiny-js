import React, { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { Alert, Heading } from "@webiny/admin-ui";
import type { IFormVM } from "./abstractions.js";

interface FormErrorsProps {
    form: IFormVM;
}

export const FormErrors = observer(({ form }: FormErrorsProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (form.submitCount > 0 && form.errors.length > 0 && ref.current) {
            ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [form.submitCount]);

    if (form.errors.length === 0) {
        return null;
    }

    return (
        <div ref={ref}>
            <Alert type="danger" variant="subtle">
                <Heading level={6}>Some fields contain errors</Heading>
                <ul className="list-disc mt-sm">
                    {form.errors.map((error, index) => (
                        <li key={index} className={"my-xs"}>
                            {error.path ? (
                                <button
                                    type="button"
                                    className="underline cursor-pointer"
                                    onClick={() => form.focusField(error.path)}
                                >
                                    {error.breadcrumb
                                        ? error.breadcrumb.join(" › ")
                                        : (error.label ?? error.path)}
                                </button>
                            ) : (
                                error.label
                            )}
                            : {error.message}
                        </li>
                    ))}
                </ul>
            </Alert>
        </div>
    );
});
