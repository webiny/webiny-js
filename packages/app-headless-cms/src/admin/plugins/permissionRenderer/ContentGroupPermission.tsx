import React, { useState, Fragment, useEffect } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentModelGroupPermission = "cms.contentModelGroups.manage";

const contentGroupPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: cmsContentModelGroupPermission,
        label: "All content groups"
    },
    {
        id: 2,
        value: cmsContentModelGroupPermission + "#own",
        label: "Only the content groups they created"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const ContentGroupPermission = ({ addPermission }) => {
    const [value, setValue] = useState(() => ({
        name: "",
        own: false
    }));
    const [permission, setPermission] = useState("#");

    useEffect(() => {
        // Set settings for permission
        const own = permission.includes("own");
        const permissionName = permission.split("#")[0];

        setValue(value => ({
            ...value,
            name: permissionName,
            own
        }));
    }, [permission]);

    useEffect(() => {
        addPermission({ permission: value, key: cmsContentModelGroupPermission });
    }, [value]);

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography
                        use={"subtitle2"}
                    >{t`Create, edit and delete content groups`}</Typography>
                </div>
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Content groups"}
                    value={permission}
                    onChange={value => setPermission(value)}
                >
                    {contentGroupPermissionOptions.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
        </Fragment>
    );
};
