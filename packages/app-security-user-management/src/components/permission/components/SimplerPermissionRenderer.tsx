import React, { Fragment, useCallback, useEffect, useReducer, Reducer } from "react";
import {
    ActionTypes,
    SimplePermissionStateType,
    ReducerActionType
} from "@webiny/app-security-user-management/components/permission/utils";
import { Cell } from "@webiny/ui/Grid";
import { PermissionInfo } from "@webiny/app-security-user-management/components/permission/components/StyledComponents";
import { Switch } from "@webiny/ui/Switch";

export type SimplePermissionRendererParamsType = {
    value: any;
    setValue: any;
    label: string;
    permissionName: string;
    initialState: SimplePermissionStateType;
    reducer: Reducer<SimplePermissionStateType, ReducerActionType>;
};

export const SimplePermissionRenderer = ({
    value,
    setValue,
    label,
    permissionName,
    initialState,
    reducer
}: SimplePermissionRendererParamsType) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const { permission, synced } = state;

    useEffect(() => {
        if (value && value.name && !synced) {
            dispatch({ type: ActionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, permission]);

    useEffect(() => {
        setValue(permission);
    }, [permission]);

    const handleOnChange = useCallback(
        value =>
            dispatch({
                type: ActionTypes.SET_PERMISSION_LEVEL,
                payload: value
            }),
        []
    );

    return (
        <Fragment>
            <Cell span={6}>
                <PermissionInfo title={label} />
            </Cell>
            <Cell span={6} align={"middle"}>
                <Switch value={permission.name === permissionName} onChange={handleOnChange} />
            </Cell>
        </Fragment>
    );
};
