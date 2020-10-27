import React, { Fragment, useCallback, useEffect, useReducer } from "react";
import { Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import {
    PermissionAccessLevel,
    PermissionInfo
} from "@webiny/app-security-user-management/components/permission";
import { i18n } from "@webiny/app/i18n";
import { reducer, actionTypes, initialState, contentModelPermissionOptions } from "../utils";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer/FilePermission");

export const FilesPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, permission, synced } = state;

    useEffect(() => {
        if (value && value.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, permission]);

    useEffect(() => {
        setValue(permission);
    }, [permission]);

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
                <PermissionInfo title={t`Manage files`} />
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Files"}
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
            <PermissionAccessLevel value={permission} setValue={updatePermission} />
        </Fragment>
    );
};
