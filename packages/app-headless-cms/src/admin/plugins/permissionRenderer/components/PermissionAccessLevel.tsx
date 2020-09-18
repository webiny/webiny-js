// type AccessLevelType = "readOnly" | "readWrite" | "readWriteDelete";
import React, { Fragment } from "react";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { flexClass } from "./StyledComponents";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

type AccessLevelType = AccessLevel;

export enum AccessLevel {
    ReadOnly = "readOnly",
    ReadWrite = "readWrite",
    ReadWriteDelete = "readWriteDelete",
    ReadWritePublish = "readWritePublish",
    ReadWriteDeletePublish = "readWriteDeletePublish"
}

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
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Access level`}</Typography>
                </div>
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
