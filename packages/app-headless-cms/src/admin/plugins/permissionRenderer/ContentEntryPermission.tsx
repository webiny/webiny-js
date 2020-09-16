import React, { useEffect, Fragment, useReducer, useCallback } from "react";
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

const PERMISSION_CMS_CONTENT_ENTRY_CRUD = "cms.manage.contentEntry.crud";

const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_ENTRY_CRUD,
        label: "Records inside any content model"
    },
    {
        id: 2,
        value: PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#models",
        label: "Only records inside specific content models"
    },
    {
        id: 3,
        value: PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#groups",
        label: "Only records in specific content groups"
    },
    {
        id: 4,
        value: PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#own",
        label: "Only records in content models they created"
    }
];

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

const actionTypes = {
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

const reducer = (currentState, action) => {
    let permissionLevel = currentState.permissionLevel;
    let showModelSelector = currentState.showModelSelector;
    let showGroupSelector = currentState.showGroupSelector;

    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            showModelSelector = permissionLevel.includes("#models");
            showGroupSelector = permissionLevel.includes("#groups");

            const own = permissionLevel.includes("own");
            const permissionName = permissionLevel.split("#")[0];

            let models = currentState.permission.models;
            if (currentState.showModelSelector && !showModelSelector) {
                models = [];
            }

            let groups = currentState.permission.groups;
            if (currentState.showModelSelector && !showModelSelector) {
                groups = [];
            }

            return {
                ...currentState,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
                permission: {
                    ...currentState.permission,
                    name: permissionName,
                    own,
                    models,
                    groups
                }
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permission: { ...currentState.permission, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const currentPermission = action.payload;

            permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_CRUD;

            if (currentPermission.own) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#own";
            }

            if (Array.isArray(currentPermission.models) && currentPermission.models.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#models";
                showModelSelector = true;
            }

            if (Array.isArray(currentPermission.groups) && currentPermission.groups.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_ENTRY_CRUD + "#groups";
                showGroupSelector = true;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showModelSelector,
                showGroupSelector,
                permission: { ...currentPermission, name: PERMISSION_CMS_CONTENT_ENTRY_CRUD }
            };
        case actionTypes.RESET:
            return {
                ...initialState
            };
        default:
            throw new Error("Unrecognised action: " + action);
    }
};

const initialState = {
    permissionLevel: "#",
    permission: { name: "", own: false, models: [], groups: [], locales: [], canPublish: false },
    showModelSelector: false,
    showGroupSelector: false,
    synced: false
};

export const ContentEntryPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, permission, showModelSelector, showGroupSelector, synced } = state;

    const currentPermission = value[PERMISSION_CMS_CONTENT_ENTRY_CRUD];

    useEffect(() => {
        if (currentPermission && currentPermission.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: currentPermission });
        }
    }, [currentPermission, permission]);

    useEffect(() => {
        setValue(PERMISSION_CMS_CONTENT_ENTRY_CRUD, permission);
    }, [permission]);

    // Data fetching
    const {
        data: contentModelData,
        error: contentModelError,
        loading: contentModelLoading
    } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(contentModelData, "listContentModels.data", []).map(contentModel => ({
        id: contentModel.modelId,
        name: contentModel.name
    }));

    const {
        data: contentModelGroupData,
        error: contentModelGroupError,
        loading: contentModelGroupLoading
    } = useQuery(LIST_CONTENT_MODEL_GROUPS);
    const contentModelGroups = get(
        contentModelGroupData,
        "contentModelGroups.data",
        []
    ).map(contentModelGroup => ({ id: contentModelGroup.slug, name: contentModelGroup.name }));

    const updatePermission = useCallback(
        (key, value) =>
            dispatch({
                type: actionTypes.UPDATE_PERMISSION,
                payload: { key, value }
            }),
        []
    );

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
                    value={permissionLevel}
                    onChange={value =>
                        dispatch({ type: actionTypes.SET_PERMISSION_LEVEL, payload: value })
                    }
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
                        value={permission}
                        setValue={updatePermission}
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
                        value={permission}
                        setValue={updatePermission}
                        selectorKey={"groups"}
                        dataList={{
                            loading: contentModelGroupLoading,
                            error: contentModelGroupError,
                            list: contentModelGroups
                        }}
                    />
                </Cell>
            )}
            <ContentEntryPermissionBasedOnLanguage value={permission} setValue={updatePermission} />
            <ContentEntryPublishPermission value={permission} setValue={updatePermission} />
        </Fragment>
    );
};
