import React, { useMemo, useCallback } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { LIST_TEAMS } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type TeamAutocompleteProps = Omit<
    React.ComponentProps<typeof AutoComplete>,
    "options" | "onValueChange"
> & {
    onChange?: (value: string) => void;
};

export const TeamAutocomplete = ({ onChange, value, ...props }: TeamAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_TEAMS);
    const rawOptions = loading || !data ? [] : data.security.teams.data;

    const options = useMemo(
        () => rawOptions.map((team: any) => ({ label: team.name, value: team.id })),
        [rawOptions]
    );

    const onValueChange = useCallback((id: string) => onChange?.(id), [onChange]);

    return (
        <AutoComplete
            {...props}
            options={options}
            value={loading ? undefined : (value as string | undefined)}
            onValueChange={onValueChange}
        />
    );
};
