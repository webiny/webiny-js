import React, { useEffect, useState, Fragment } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { LIST_CONTENT_MODELS } from "@webiny/app-headless-cms/admin/viewsGraphql";
import get from "lodash.get";
import { PermissionSelector } from "./PermissionSelector";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentModelPermission = "cms.contentModels.manage";

const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: cmsContentModelPermission,
        label: "All content models"
    },
    {
        id: 2,
        value: cmsContentModelPermission + "#own",
        label: "Only the content models they created"
    },
    {
        id: 3,
        value: cmsContentModelPermission + "#custom",
        label: "Only specific content models"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const ContentModelPermission = ({ addPermission }) => {
    const [value, setValue] = useState(() => ({
        name: "",
        own: false,
        models: []
    }));
    const [permission, setPermission] = useState("#");
    const [showCustomPermission, setShowCustomPermission] = useState(false);

    useEffect(() => {
        // Set settings for permission
        const isCustom = permission.includes("custom");
        setShowCustomPermission(isCustom);

        const own = permission.includes("own");
        const permissionName = permission.split("#")[0];

        setValue(value => ({
            ...value,
            name: permissionName,
            own
        }));
    }, [permission]);

    useEffect(() => {
        addPermission({ permission: value, key: cmsContentModelPermission });
    }, [value]);

    const { data, error, loading } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(data, "listContentModels.data", []);

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography
                        use={"subtitle2"}
                    >{t`Create, edit and delete content models`}</Typography>
                </div>
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Content models"}
                    value={permission}
                    onChange={value => setPermission(value)}
                >
                    {contentModelPermissionOptions.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
            {showCustomPermission && (
                <Cell span={12}>
                    <PermissionSelector
                        value={value}
                        setValue={(key, newValue) => {
                            setValue(value => ({ ...value, [key]: newValue }));
                        }}
                        selectorKey={"models"}
                        dataList={{
                            loading,
                            error,
                            list: contentModels
                        }}
                    />
                </Cell>
            )}
        </Fragment>
    );
};