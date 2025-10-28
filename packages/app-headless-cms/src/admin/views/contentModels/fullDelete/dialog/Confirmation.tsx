import React, { useCallback, useMemo } from "react";
import type { CmsErrorResponse, CmsModel } from "~/types.js";
import { Input } from "@webiny/ui/Input/index.js";
import { createValidationValue } from "./validationValue.js";
import { Alert } from "@webiny/admin-ui";

export interface IConfirmationProps {
    model: CmsModel;
    confirmation: string;
    setConfirmation: (value: string) => void;
    error: CmsErrorResponse | null;
}

export const Confirmation = (props: IConfirmationProps) => {
    const { model, setConfirmation, confirmation, error } = props;

    const onChange = useCallback(
        (value: string) => {
            setConfirmation(value);
        },
        [confirmation]
    );

    const placeholder = useMemo(() => {
        return createValidationValue(model);
    }, [model.modelId]);

    return (
        <>
            <p>Are you sure you want to delete this content model and all of its entries?</p>
            <p>
                If yes, please write{" "}
                <span className={"font-semibold text-neutral-primary"}>{placeholder}</span> in the
                confirmation input:
            </p>
            <p>
                <br />
            </p>
            <div>
                <Input
                    data-testid="cms-delete-content-model-input"
                    onChange={onChange}
                    placeholder={placeholder}
                    value={confirmation}
                />
                {error && (
                    <Alert type={"danger"} className={"mt-sm"}>
                        {error.message}
                    </Alert>
                )}
            </div>
        </>
    );
};
