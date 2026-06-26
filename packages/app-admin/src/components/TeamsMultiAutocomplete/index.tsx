import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { MultiAutoComplete } from "@webiny/admin-ui";
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
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);
    const [rawOptions, setRawOptions] = useState<TeamDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.execute<ListTeamsResponse>({ query: LIST_TEAMS }).then(response => {
            setRawOptions(response.security?.teams?.data || []);
            setLoading(false);
        });
    }, []);

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
