import React, { Fragment, useCallback, useEffect, useReducer } from "react";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { Typography } from "@webiny/ui/Typography";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");
import { flexClass } from "../../components/StyledComponents";
import { reducer, initialState, actionTypes, contentGroupPermissionOptions } from "../utils";
import { PermissionAccessLevel } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/PermissionAccessLevel";

export const ContentGroupPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permission, permissionLevel, synced } = state;

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
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Manage content groups`}</Typography>
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
            <PermissionAccessLevel value={permission} setValue={updatePermission} />
        </Fragment>
    );
};
