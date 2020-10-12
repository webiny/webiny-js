import React, { useEffect, Fragment, useReducer, useCallback } from "react";
import get from "lodash.get";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import {
    PermissionSelector,
    PermissionSelectorWrapper
} from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionSelector";
import { i18n } from "@webiny/app/i18n";
import { flexClass } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/StyledComponents";
import { reducer, initialState, actionTypes, environmentPermissionOption } from "../utils";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const CmsEnvironmentPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permissionLevel, permission, showCustomPermission, synced } = state;

    useEffect(() => {
        if (value && value.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, synced]);

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

    const { environments } = useCms();
    const list = get(environments, "environments", []).map(item => ({
        id: item.slug,
        name: item.name
    }));

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography
                        use={"subtitle2"}
                    >{t`Manage content on specific environments`}</Typography>
                </div>
            </Cell>
            <Cell span={6}>
                <Select
                    label={"Environments"}
                    value={permissionLevel}
                    onChange={value =>
                        dispatch({ type: actionTypes.SET_PERMISSION_LEVEL, payload: value })
                    }
                >
                    {environmentPermissionOption.map(item => (
                        <option key={item.id} value={item.value}>
                            {item.label}
                        </option>
                    ))}
                </Select>
            </Cell>
            {showCustomPermission && (
                <PermissionSelectorWrapper>
                    <PermissionSelector
                        value={permission}
                        setValue={updatePermission}
                        selectorKey={"environments"}
                        dataList={{
                            loading: false,
                            error: null,
                            list: list
                        }}
                    />
                </PermissionSelectorWrapper>
            )}
        </Fragment>
    );
};
