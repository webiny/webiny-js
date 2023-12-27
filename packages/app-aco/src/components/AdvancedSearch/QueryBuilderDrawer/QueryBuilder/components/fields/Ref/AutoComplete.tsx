import React from "react";
import { Bind } from "@webiny/form";
import { AutoComplete as BaseAutocomplete } from "@webiny/ui/AutoComplete";
import { RefPresenterViewModel } from "./RefPresenter";

export interface AutoCompleteProps {
    vm: RefPresenterViewModel;
    name: string;
    onInput(value: string): void;
}

export const AutoComplete = (props: AutoCompleteProps) => {
    return (
        <Bind name={props.name}>
            {({ onChange, validation }) => (
                <BaseAutocomplete
                    label={"Value"}
                    value={props.vm.selected}
                    validation={validation}
                    onChange={onChange}
                    onInput={props.onInput}
                    options={props.vm.options}
                    loading={props.vm.loading}
                />
            )}
        </Bind>
    );
};
