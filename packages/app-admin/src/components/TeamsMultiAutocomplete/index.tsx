import React, { useMemo, useCallback } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { LIST_TEAMS } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type TeamsMultiAutocompleteProps = Omit<
    React.ComponentProps<typeof MultiAutoComplete>,
    "options" | "onValuesChange"
> & {
    onChange?: (values: string[]) => void;
};

export const TeamsMultiAutocomplete = ({
    onChange,
    values,
    ...props
}: TeamsMultiAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_TEAMS);
    const rawOptions = loading || !data?.security?.teams?.data ? [] : data.security.teams.data;

    const options = useMemo(
        () => rawOptions.map((team: any) => ({ label: team.name, value: team.id })),
        [rawOptions]
    );

    const onValuesChange = useCallback((ids: string[]) => onChange?.(ids), [onChange]);

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
