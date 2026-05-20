import React, { useMemo } from "react";
import { Bind } from "@webiny/form";
import { AutoComplete as AdminAutoComplete } from "@webiny/admin-ui";
import type { RefPresenterViewModel } from "./RefPresenter.js";

export interface AutoCompleteProps {
    vm: RefPresenterViewModel;
    name: string;
    onInput(value: string): void;
}

export const AutoComplete = (props: AutoCompleteProps) => {
    const options = useMemo(
        () =>
            props.vm.options.map((opt: any) => ({
                label: opt.name ?? opt.id,
                value: opt.entryId ?? opt.id,
                item: opt
            })),
        [props.vm.options]
    );

    const currentValue = useMemo(() => {
        const sel = props.vm.selected as any;
        if (!sel) {
            return undefined;
        }
        return sel.entryId ?? sel.id;
    }, [props.vm.selected]);

    return (
        <Bind name={props.name}>
            {({ onChange, validation }) => (
                <AdminAutoComplete
                    label={"Value"}
                    value={currentValue}
                    validation={validation}
                    onValueChange={(value: string) => {
                        const opt = options.find(o => o.value === value);
                        if (!opt?.item) {
                            return;
                        }
                        onChange(
                            JSON.stringify({
                                entryId: opt.item.entryId ?? opt.item.id,
                                modelId: opt.item.modelId
                            })
                        );
                    }}
                    onValueSearch={props.onInput}
                    options={options}
                    loading={props.vm.loading}
                />
            )}
        </Bind>
    );
};
