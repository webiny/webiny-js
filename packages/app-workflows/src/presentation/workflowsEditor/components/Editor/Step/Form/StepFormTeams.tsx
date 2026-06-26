import React, { useCallback, useMemo } from "react";
import type { BindComponentRenderProp } from "@webiny/form";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { TeamsMultiAutocomplete } from "@webiny/app-admin";

interface IInput {
    id: string;
}

interface IAutocompleteProps {
    bind: BindComponentRenderProp;
}
const Autocomplete = ({ bind }: IAutocompleteProps) => {
    const values = useMemo(() => {
        if (!Array.isArray(bind.value) || !bind.value.length) {
            return [];
        }
        return bind.value.map((item: IInput) => item.id).filter(Boolean) as string[];
    }, [bind.value]);

    const onChange = useCallback(
        (ids: string[]) => {
            return bind.onChange(ids.map(id => ({ id })));
        },
        [bind.onChange]
    );

    return (
        <TeamsMultiAutocomplete
            label={"Select which teams need to review and approve this workflow"}
            values={values}
            onChange={onChange}
            validation={bind.validation}
        />
    );
};

export const StepFormTeams = () => {
    return (
        <Bind name={"teams"} validators={validation.create("required,minLength:1")}>
            {bind => {
                return <Autocomplete bind={bind} />;
            }}
        </Bind>
    );
};
