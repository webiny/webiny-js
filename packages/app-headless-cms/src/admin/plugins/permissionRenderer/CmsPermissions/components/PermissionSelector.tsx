import React, { Fragment } from "react";
import { Typography } from "@webiny/ui/Typography";
import { CircularProgress } from "@webiny/ui/Progress";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import { i18n } from "@webiny/app/i18n";
import { ApolloError } from "apollo-client";
import { Cell } from "@webiny/ui/Grid";
import { BindComponent } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export type PermissionSelectorCheckList = {
    id: string;
    name: string;
};

export type PermissionSelectorProps = {
    Bind: BindComponent;
    selectorKey: string;
    dataList: {
        loading: boolean;
        error: ApolloError;
        list: PermissionSelectorCheckList[];
    };
    [key: string]: any;
};

export const PermissionSelector = ({
    Bind,
    entity,
    selectorKey,
    dataList
}: PermissionSelectorProps) => {
    const { list, error, loading } = dataList;

    if (error) {
        return (
            <Typography use={"subtitle2"}>{error?.message || "Something went wrong!"}</Typography>
        );
    }

    if (loading) {
        return <CircularProgress label={t`Loading content models...`} />;
    }

    return (
        <Bind name={`${entity}Props.${selectorKey}`}>
            <CheckboxGroup
                label={selectorKey}
                description={t`Select the {selectorKey} this permission will be allowed to access.`(
                    {
                        selectorKey
                    }
                )}
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
        </Bind>
    );
};

export const PermissionSelectorWrapper = ({ children }) => (
    <Fragment>
        <Cell span={1} />
        <Cell span={11}>{children}</Cell>
    </Fragment>
);
