import React, { Fragment } from "react";
import { Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo } from "./StyledComponents";

const t = i18n.ns("app-security-user-management/components/permission");

type AccessLevelType = AccessLevel;

export type AccessLevelOperationType = "list" | "update" | "delete" | "publish";

export enum AccessLevel {
    ReadOnly = "list",
    ReadWrite = "list|update",
    ReadWriteDelete = "list|update|delete",
    ReadWritePublish = "list|update|publish",
    ReadWriteDeletePublish = "list|update|delete|publish"
}

export const accessLevelOperations: AccessLevelOperationType[] = [
    "list",
    "update",
    "delete",
    "publish"
];

export const orderAccessLevel = list => {
    return list.sort(accessLevelSorter);
};

const accessLevelSorter = (a, b) => {
    if (accessLevelOperations.indexOf(a) > accessLevelOperations.indexOf(b)) {
        return 1;
    } else if (accessLevelOperations.indexOf(a) < accessLevelOperations.indexOf(b)) {
        return -1;
    } else {
        return 0;
    }
};

const accessLevelOptions = [
    {
        id: 0,
        value: AccessLevel.ReadOnly,
        label: "Read-only"
    },
    {
        id: 1,
        value: AccessLevel.ReadWrite,
        label: "Read & write"
    },
    {
        id: 2,
        value: AccessLevel.ReadWriteDelete,
        label: "Read, write & delete"
    }
];

const accessLevelOptionsForRecord = [
    ...accessLevelOptions,
    {
        id: 3,
        value: AccessLevel.ReadWritePublish,
        label: "Read, write & publish"
    },
    {
        id: 4,
        value: AccessLevel.ReadWriteDeletePublish,
        label: "Read, write, delete & publish"
    }
];

export type PermissionAccessLevelPropsType = {
    value: any;
    setValue: (key: string, value: AccessLevelType) => void;
    publish?: boolean;
};

export const PermissionAccessLevel = (props: PermissionAccessLevelPropsType) => {
    const { value, setValue, publish } = props;
    const accessLevel: AccessLevelType = value.accessLevel;
    const onChange = value => setValue("accessLevel", value);
    const disabled = value.own;

    const options = publish ? accessLevelOptionsForRecord : accessLevelOptions;

    return (
        <Fragment>
            <Cell span={6}>
                <PermissionInfo title={t`Access level`} />
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Access level"}
                    value={accessLevel}
                    onChange={onChange}
                    disabled={disabled}
                >
                    {options.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
        </Fragment>
    );
};
