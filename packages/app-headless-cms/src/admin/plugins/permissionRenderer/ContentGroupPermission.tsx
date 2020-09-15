import React, { Fragment, useEffect, useReducer } from "react";
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

            const own = permissionLevel.includes("own");
            const permissionName = permissionLevel.split("#")[0];

            return {
                ...currentState,
                permissionLevel,
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

            permissionLevel = cmsContentModelGroupPermission;

            if (currentPermission.own) {
                permissionLevel = cmsContentModelGroupPermission + "#own";
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                permission: { ...currentPermission, name: cmsContentModelGroupPermission }
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
    permission: { name: "", own: false },
    synced: false
};

export const ContentGroupPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permission, permissionLevel, synced } = state;

    const currentPermission = value[cmsContentModelGroupPermission];

    useEffect(() => {
        if (currentPermission && currentPermission.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: currentPermission });
        }
    }, [currentPermission, permission]);

    useEffect(() => {
        setValue(cmsContentModelGroupPermission, permission);
    }, [permission]);

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
                    value={permissionLevel}
                    onChange={value =>
                        dispatch({ type: actionTypes.SET_PERMISSION_LEVEL, payload: value })
                    }
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
