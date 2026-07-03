import React, { useCallback, useMemo } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { LIST_TEAMS } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type TeamsMultiAutocompleteProps = Omit<
    React.ComponentProps<typeof MultiAutoComplete>,
    "options" | "onValuesChange"
> & {
    onChange?: (values: string[]) => void;
};

export const TeamsMultiAutocomplete = ({ onChange, ...props }: TeamsMultiAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_TEAMS);
    const rawOptions = loading || !data?.security?.teams?.data ? [] : data.security.teams.data;

    const options = useMemo(
        () => rawOptions.map((team: any) => ({ label: team.name, value: team.id })),
        [rawOptions]
    );

    const onValuesChange = useCallback((ids: string[]) => onChange?.(ids), [onChange]);
    /**
     * This is required because the Bind, which currently wraps this component passes "values" as "value" prop, not "values".
     * "values" is added to safeguard for future changes. When we move to new forms, remove this part.
     */
    const values = useMemo(() => {
        const selected = Array.isArray(props.values)
            ? props.values
            : Array.isArray(props.value)
              ? props.value
              : [];

        return selected
            .map(s => {
                if (typeof s === "string") {
                    return s;
                } else if (typeof s === "object") {
                    return s?.id;
                }
                return null;
            })
            .filter((s): s is string => !!s);
    }, [props.values, props.value]);

    return (
        <MultiAutoComplete
            uniqueValues
            {...props}
            options={options}
            values={loading ? undefined : (values as string[] | undefined)}
            onValuesChange={onValuesChange}
        />
    );
};
