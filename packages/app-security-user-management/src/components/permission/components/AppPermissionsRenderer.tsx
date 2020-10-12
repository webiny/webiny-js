import React, { Fragment, useEffect, useCallback, useReducer, Reducer } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import {
    PermissionInfo,
    PermissionRendererWrapper,
    gridNoPaddingClass
} from "@webiny/app-security-user-management/components/permission";
import {
    ActionTypes,
    CustomPermissionStateType,
    ReducerActionType
} from "@webiny/app-security-user-management/components/permission/utils";

const t = i18n.ns("app-security-user-management/plugins/permissionRenderer");

export type AppPermissionRendererParamsType = {
    value: any;
    onChange: any;
    initialState: CustomPermissionStateType;
    reducer: Reducer<CustomPermissionStateType, ReducerActionType>;
    fullAccessPermissionName: any;
    permissionLevelOptions: any;
    permissionRendererPlugins: any[];
};

export const AppPermissionsRenderer = ({
    value,
    onChange,
    reducer,
    initialState,
    fullAccessPermissionName,
    permissionLevelOptions,
    permissionRendererPlugins
}: AppPermissionRendererParamsType) => {
    const [
        { permissionLevel, showCustomPermissionUI, permission, permissions, synced },
        dispatch
    ] = useReducer(reducer, initialState);

    useEffect(() => {
        if (value && !synced) {
            dispatch({ type: ActionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, synced]);

    const keys = permissionRendererPlugins.map(pl => pl.key);

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
                [fullAccessPermissionName]: initialState.permission
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
                [fullAccessPermissionName]: initialState.permission,
                ...reset
            });
        }
    }, [permission, permissions]);

    const createSetValue = useCallback(
        key => value =>
            dispatch({
                type: ActionTypes.UPDATE_PERMISSION,
                payload: {
                    key,
                    value
                }
            }),
        []
    );

    return (
        <Fragment>
            <Grid className={gridNoPaddingClass}>
                <Cell span={6}>
                    <PermissionInfo title={t`Permission level`} />
                </Cell>
                <Cell span={6}>
                    <Select
                        label={t`Permission level`}
                        value={permissionLevel}
                        onChange={value =>
                            dispatch({ type: ActionTypes.SET_PERMISSION_LEVEL, payload: value })
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
            {showCustomPermissionUI && (
                <Fragment>
                    {permissionRendererPlugins.map(pl => (
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
