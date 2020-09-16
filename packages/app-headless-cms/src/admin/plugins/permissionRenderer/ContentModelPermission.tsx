import React, { useEffect, useReducer, Fragment } from "react";
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

const PERMISSION_CMS_CONTENT_MODEL_CRUD = "cms.manage.contentModel.crud";

const contentModelPermissionOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: PERMISSION_CMS_CONTENT_MODEL_CRUD,
        label: "All content models"
    },
    {
        id: 2,
        value: PERMISSION_CMS_CONTENT_MODEL_CRUD + "#own",
        label: "Only the content models they created"
    },
    {
        id: 3,
        value: PERMISSION_CMS_CONTENT_MODEL_CRUD + "#custom",
        label: "Only specific content models"
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
    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            // Set settings for permission
            permissionLevel = action.payload;

            const isCustom = permissionLevel.includes("custom");
            const own = permissionLevel.includes("own");
            const permissionName = permissionLevel.split("#")[0];

            return {
                ...currentState,
                permissionLevel,
                showCustomPermission: isCustom,
                permission: {
                    ...currentState.permission,
                    name: permissionName,
                    own
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

            permissionLevel = PERMISSION_CMS_CONTENT_MODEL_CRUD;
            let showCustomPermission = currentState.showCustomPermission;

            if (currentPermission.own) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL_CRUD + "#own";
            }

            if (Array.isArray(currentPermission.models) && currentPermission.models.length) {
                permissionLevel = PERMISSION_CMS_CONTENT_MODEL_CRUD + "#custom";
                showCustomPermission = true;
            }
            return {
                ...currentState,
                synced: true,
                permissionLevel,
                showCustomPermission,
                permission: { ...currentPermission, name: PERMISSION_CMS_CONTENT_MODEL_CRUD }
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
    permission: { name: "", own: false, models: [] },
    showCustomPermission: false,
    synced: false
};

export const ContentModelPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, permission, showCustomPermission, synced } = state;

    const currentPermission = value[PERMISSION_CMS_CONTENT_MODEL_CRUD];

    useEffect(() => {
        if (currentPermission && currentPermission.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: currentPermission });
        }
    }, [currentPermission, permission]);

    useEffect(() => {
        setValue(PERMISSION_CMS_CONTENT_MODEL_CRUD, permission);
    }, [permission]);

    const { data, error, loading } = useQuery(LIST_CONTENT_MODELS);
    const contentModels = get(data, "listContentModels.data", []).map(item => ({
        id: item.modelId,
        name: item.name
    }));

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
            {showCustomPermission && (
                <Cell span={12}>
                    <PermissionSelector
                        value={permission}
                        setValue={(key, newValue) => {
                            dispatch({
                                type: actionTypes.UPDATE_PERMISSION,
                                payload: { key, value: newValue }
                            });
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
