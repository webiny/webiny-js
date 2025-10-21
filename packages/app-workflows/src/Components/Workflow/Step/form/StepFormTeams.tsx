import React, { useCallback } from "react";
import type { BindComponentRenderProp } from "@webiny/form";
import { Bind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { TeamsMultiAutocomplete } from "@webiny/app-security-access-management";

interface IInput {
    id?: string;
}

const mapInput = (input?: IInput[]): Required<IInput>[] => {
    if (!input?.length) {
        return [];
    }
    return input
        .filter((item): item is Required<IInput> => {
            return !!item.id;
        })
        .map(item => {
            return {
                id: item.id
            };
        });
};

interface IAutocompleteProps {
    bind: BindComponentRenderProp;
}
const Autocomplete = ({ bind }: IAutocompleteProps) => {
    const onChange = useCallback(
        (input?: IInput[]) => {
            return bind.onChange(mapInput(input));
        },
        [bind.onChange]
    );

    return <TeamsMultiAutocomplete {...bind} onChange={onChange} />;
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
