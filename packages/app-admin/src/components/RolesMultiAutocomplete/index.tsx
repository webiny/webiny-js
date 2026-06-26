import React, { useMemo, useCallback, useEffect, useState } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { LIST_ROLES } from "./graphql.js";

interface RoleDto {
    id: string;
    name: string;
}

interface ListRolesResponse {
    security: {
        roles: {
            data: RoleDto[];
        };
    };
}

type RolesMultiAutocompleteProps = Omit<
    React.ComponentProps<typeof MultiAutoComplete>,
    "options" | "onValuesChange"
> & {
    onChange?: (values: string[]) => void;
};

export const RolesMultiAutocomplete = ({
    onChange,
    values,
    ...props
}: RolesMultiAutocompleteProps) => {
    const container = useContainer();
    const client = container.resolve(MainGraphQLClient);
    const [rawOptions, setRawOptions] = useState<RoleDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.execute<ListRolesResponse>({ query: LIST_ROLES }).then(response => {
            setRawOptions(response.security?.roles?.data || []);
            setLoading(false);
        });
    }, []);

    const options = useMemo(
        () => rawOptions.map((role: any) => ({ label: role.name, value: role.id })),
        [rawOptions]
    );

    const onValuesChange = useCallback((ids: string[]) => onChange?.(ids), [onChange]);

    return (
        <MultiAutoComplete
            {...props}
            options={options}
            values={loading ? undefined : (values as string[] | undefined)}
            onValuesChange={onValuesChange}
        />
    );
};
