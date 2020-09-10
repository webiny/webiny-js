import React, { useEffect, useState, Fragment } from "react";
import { css } from "emotion";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import get from "lodash.get";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { ContentEntryPermissionBasedOnLanguage } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/ContentEntryBasedOnLanguagePermission";
import { ContentEntryPublishPermission } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/ContentEntryPublishPermission";
import { PermissionSelector } from "./PermissionSelector";
import { LIST_CONTENT_MODELS } from "@webiny/app-headless-cms/admin/viewsGraphql";
import { LIST_CONTENT_MODEL_GROUPS } from "@webiny/app-headless-cms/admin/views/ContentModelGroups/graphql";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const cmsContentEntryPermission = "cms.contentEntries.manage";

const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: cmsContentEntryPermission,
        label: "Records inside any content model"
    },
    {
        id: 2,
        value: cmsContentEntryPermission + "#models",
        label: "Only records inside specific content models"
    },
    {
        id: 3,
        value: cmsContentEntryPermission + "#groups",
        label: "Only records in specific content groups"
    },
    {
        id: 4,
        value: cmsContentEntryPermission + "#own",
        label: "Only records in content models they created"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

export const ContentEntryPermission = ({ addPermission }) => {
    const [value, setValue] = useState(() => ({
        name: "",
        own: false,
        models: [],
        groups: [],
        locales: [],
        canPublish: false
    }));
    const [permission, setPermission] = useState("#");
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showGroupSelector, setShowGroupSelector] = useState(false);

    useEffect(() => {
        // Set settings for permission
        setShowModelSelector(permission.includes("#models"));
        setShowGroupSelector(permission.includes("#groups"));

        const own = permission.includes("own");
        const permissionName = permission.split("#")[0];

        setValue(value => ({
            ...value,
            name: permissionName,
            own
        }));
    }, [permission]);

    useEffect(() => {
        addPermission({ permission: value, key: cmsContentEntryPermission });
    }, [value]);

    // Data fetching
    const {
        data: contentModelData,
        error: contentModelError,
        loading: contentModelLoading
    } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(contentModelData, "listContentModels.data", []);

    const {
        data: contentModelGroupData,
        error: contentModelGroupError,
        loading: contentModelGroupLoading
    } = useQuery(LIST_CONTENT_MODEL_GROUPS);
    const contentModelGroups = get(contentModelGroupData, "contentModelGroups.data", []);

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography
                        use={"subtitle2"}
                    >{t`Create, edit and delete content records`}</Typography>
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
            {showModelSelector && (
                <Cell span={12}>
                    <PermissionSelector
                        value={value}
                        setValue={(key, newValue) => {
                            setValue(value => ({ ...value, [key]: newValue }));
                        }}
                        selectorKey={"models"}
                        dataList={{
                            loading: contentModelLoading,
                            error: contentModelError,
                            list: contentModels
                        }}
                    />
                </Cell>
            )}
            {showGroupSelector && (
                <Cell span={12}>
                    <PermissionSelector
                        value={value}
                        setValue={(key, newValue) => {
                            setValue(value => ({ ...value, [key]: newValue }));
                        }}
                        selectorKey={"groups"}
                        dataList={{
                            loading: contentModelGroupLoading,
                            error: contentModelGroupError,
                            list: contentModelGroups
                        }}
                    />
                </Cell>
            )}
            <ContentEntryPermissionBasedOnLanguage
                value={value}
                setValue={(key, newValue) => {
                    setValue(value => ({ ...value, [key]: newValue }));
                }}
            />
            <ContentEntryPublishPermission
                value={value}
                setValue={(key, newValue) => {
                    setValue(value => ({ ...value, [key]: newValue }));
                }}
            />
        </Fragment>
    );
};
