import React, { Fragment, useEffect } from "react";
import { ApolloError } from "apollo-client";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { Cell } from "@webiny/ui/Grid";
import { i18n } from "@webiny/app/i18n";
import get from "lodash/get";

const t = i18n.ns("app-security-user-management/components/permission");

export type PermissionSelectorCheckList = {
    id: string;
    name: string;
};

export type PermissionSelectorProps = {
    value: any;
    setValue: (key: string, value: any) => void;
    selectorKey: string;
    dataList: {
        loading: boolean;
        error: ApolloError;
        list: PermissionSelectorCheckList[];
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
        <CheckboxGroup
            value={models}
            onChange={value => setValue(selectorKey, [...value])}
            label={selectorKey}
            description={t`Select the {selectorKey} this permission will be allowed to access.`({
                selectorKey
            })}
        >
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

export const PermissionSelectorWrapper = ({ children }) => (
    <Fragment>
        <Cell span={1} />
        <Cell span={11}>{children}</Cell>
    </Fragment>
);
