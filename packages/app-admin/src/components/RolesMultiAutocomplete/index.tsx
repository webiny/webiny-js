import React, { useMemo, useCallback } from "react";
import { MultiAutoComplete } from "@webiny/admin-ui";
import { LIST_ROLES } from "./graphql.js";
import { useQuery } from "@apollo/react-hooks";

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
    const { data, loading } = useQuery(LIST_ROLES);
    const rawOptions = loading || !data ? [] : data.security.roles.data;

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
