import React, { useMemo, useCallback } from "react";
import { AutoComplete } from "@webiny/admin-ui";
import { LIST_ROLES } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

type RoleAutocompleteProps = Omit<
    React.ComponentProps<typeof AutoComplete>,
    "options" | "onValueChange"
> & {
    onChange?: (value: string) => void;
};

export const RoleAutocomplete = ({ onChange, value, ...props }: RoleAutocompleteProps) => {
    const { data, loading } = useQuery(LIST_ROLES);
    const rawOptions = loading || !data ? [] : data.security.roles.data;

    const options = useMemo(
        () => rawOptions.map((role: any) => ({ label: role.name, value: role.id })),
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
