import React, { useEffect } from "react";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import get from "lodash.get";
import { i18n } from "@webiny/app/i18n";
import { ApolloError } from "apollo-client";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export type PermissionSelectorProps = {
    value: any;
    setValue: (key: string, value: any) => void;
    selectorKey: string;
    dataList: {
        loading: boolean;
        error: ApolloError;
        list: any[];
    };
};

export const PermissionSelector = ({
    value,
    setValue,
    selectorKey,
    dataList
}: PermissionSelectorProps) => {
    const { list, error, loading } = dataList;

    const models = get(value, selectorKey, []);

    useEffect(() => {
        return () => setValue(selectorKey, []);
    }, []);

    if (error) {
        return <Typography use={"subtitle2"}>{error}</Typography>;
    }

    if (loading) {
        return <CircularProgress label={t`Loading content models...`} />;
    }

    return (
        <CheckboxGroup value={models} onChange={value => setValue(selectorKey, [...value])}>
            {({ onChange, getValue }) => (
                <React.Fragment>
                    {list.map(({ id, name }) => (
                        <Checkbox
                            key={id}
                            label={name}
                            value={getValue(id)}
                            onChange={onChange(id)}
                        />
                    ))}
                </React.Fragment>
            )}
        </CheckboxGroup>
    );
};
