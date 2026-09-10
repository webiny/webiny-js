import React, { useCallback, useEffect, useMemo } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { observer } from "mobx-react-lite";
import { TeamsAutocompletePresenterFeature } from "~/presentation/accessManagement/teams/teamsAutocomplete/feature.js";

type TeamsMultiAutocompleteProps = Omit<
    React.ComponentProps<typeof MultiAutoComplete>,
    "options" | "onValuesChange"
> & {
    onChange?: (values: string[]) => void;
};

export const TeamsMultiAutocomplete = observer(
    ({ onChange, ...props }: TeamsMultiAutocompleteProps) => {
        const { presenter } = useFeature(TeamsAutocompletePresenterFeature);

        useEffect(() => {
            presenter.init();
        }, [presenter]);

        const onValuesChange = useCallback((ids: string[]) => onChange?.(ids), [onChange]);

        const values = useMemo(() => {
            const selected = Array.isArray(props.values)
                ? props.values
                : Array.isArray(props.value)
                  ? props.value
                  : [];

            return selected.reduce<string[]>((acc, s) => {
                if (typeof s === "string") {
                    acc.push(s);
                } else if (typeof s === "object" && s?.id) {
                    acc.push(s.id);
                }
                return acc;
            }, []);
        }, [props.values, props.value]);

        return (
            <MultiAutoComplete
                uniqueValues
                {...props}
                options={presenter.vm.options}
                values={presenter.vm.loading ? undefined : values}
                onValuesChange={onValuesChange}
            />
        );
    }
);
