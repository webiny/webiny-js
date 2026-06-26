import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { AutoComplete } from "@webiny/admin-ui";
import { LIST_TEAMS } from "./graphql.js";

interface TeamDto {
    id: string;
    name: string;
}

interface ListTeamsResponse {
    security: {
        teams: {
            data: TeamDto[];
        };
    };
}

type TeamAutocompleteProps = Omit<
    React.ComponentProps<typeof AutoComplete>,
    "options" | "onValueChange"
> & {
    onChange?: (value: string) => void;
};

export const TeamAutocomplete = ({ onChange, value, ...props }: TeamAutocompleteProps) => {
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);
    const [rawOptions, setRawOptions] = useState<TeamDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.execute<ListTeamsResponse>({ query: LIST_TEAMS }).then(response => {
            setRawOptions(response.security.teams.data || []);
            setLoading(false);
        });
    }, []);

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
