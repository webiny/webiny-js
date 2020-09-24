import React, { Fragment, useEffect, useCallback, useReducer } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { plugins } from "@webiny/plugins";
import { i18n } from "@webiny/app/i18n";
import { PermissionRendererFileManager } from "@webiny/app-file-manager/types";
import {
    PermissionInfo,
    PermissionRendererWrapper
} from "@webiny/app-security-user-management/components/permission";
import { gridClass } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/StyledComponents";
import {
    reducer,
    initialState,
    actionTypes,
    permissionLevelOptions,
    PERMISSION_FILE_MANAGER_ALL
} from "../utils";

const t = i18n.ns("app-file-manager/admin/plugins/permissionRenderer");

export const FileManagerPermissions = ({ value, onChange }) => {
    const [
        { permissionLevel, showCustomPermission, permission, permissions, synced },
        dispatch
    ] = useReducer(reducer, initialState);
    console.log("%cSTATE", "color: green; fontSize: 24px");
    console.log({ permissionLevel, showCustomPermission, permission, permissions, synced });
    console.log("value: ", value);

    useEffect(() => {
        if (value && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, synced]);

    const fileManagerPermissionRendererPlugins = plugins.byType<PermissionRendererFileManager>(
        "permission-renderer-file-manager"
    );

    const keys = fileManagerPermissionRendererPlugins.map(pl => pl.key);

    // TODO: Adding a "Submit/Save" button will simplify things here.
    useEffect(() => {
        const reset = {};
        keys.forEach(key => {
            reset[key] = initialState.permission;
        });
        // If custom permissions exist
        if (Object.keys(permissions).length) {
            onChange({
                ...value,
                ...permissions,
                [PERMISSION_FILE_MANAGER_ALL]: initialState.permission
            });
        } else if (permission.name) {
            onChange({
                ...value,
                [permission.name]: permission,
                ...reset
            });
        } else {
            onChange({
                ...value,
                [PERMISSION_FILE_MANAGER_ALL]: initialState.permission,
                ...reset
            });
        }
    }, [permission, permissions]);

    const createSetValue = useCallback(
        key => value =>
            dispatch({
                type: actionTypes.UPDATE_PERMISSION,
                payload: {
                    key,
                    value
                }
            }),
        []
    );

    return (
        <Fragment>
            <Grid className={gridClass}>
                <Cell span={6}>
                    <PermissionInfo title={t`Permission level`} />
                </Cell>
                <Cell span={6}>
                    <Select
                        label={t`Permission level`}
                        value={permissionLevel}
                        onChange={value =>
                            dispatch({ type: actionTypes.SET_PERMISSION_LEVEL, payload: value })
                        }
                    >
                        {permissionLevelOptions.map(item => (
                            <option key={item.id} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </Select>
                </Cell>
            </Grid>
            {showCustomPermission && (
                <Fragment>
                    {fileManagerPermissionRendererPlugins.map(pl => (
                        <PermissionRendererWrapper key={pl.name} label={pl.label}>
                            {pl.render({
                                value: value[pl.key],
                                setValue: createSetValue(pl.key)
                            })}
                        </PermissionRendererWrapper>
                    ))}
                </Fragment>
            )}
        </Fragment>
    );
};
