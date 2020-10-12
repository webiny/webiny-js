import React, { useEffect, Fragment, useReducer, useCallback } from "react";
import { Cell } from "@webiny/ui/Grid";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Switch } from "@webiny/ui/Switch";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { i18n } from "@webiny/app/i18n";
import { flexClass } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/StyledComponents";
import { reducer, initialState, actionTypes } from "../utils";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const CmsSettingsPermission = ({ value, setValue }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { permission, synced } = state;

    useEffect(() => {
        if (value && value.name && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, synced]);

    useEffect(() => {
        setValue(permission);
    }, [permission]);

    const handleOnChangeManageEnvironments = useCallback(
        value =>
            dispatch({
                type: actionTypes.UPDATE_PERMISSION,
                payload: { key: "manageEnvironments", value }
            }),
        []
    );

    const handleOnChangeManageAliases = useCallback(
        value =>
            dispatch({
                type: actionTypes.UPDATE_PERMISSION,
                payload: { key: "manageAliases", value }
            }),
        []
    );

    return (
        <Fragment>
            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Manage environments`}</Typography>
                </div>
            </Cell>
            <Cell span={6} align={"middle"}>
                <Switch
                    value={permission.manageEnvironments}
                    onChange={handleOnChangeManageEnvironments}
                />
            </Cell>

            <Cell span={6}>
                <div className={flexClass}>
                    <IconButton icon={<HelpIcon />} onClick={() => console.log("Show info...")} />
                    <Typography use={"subtitle2"}>{t`Manage aliases`}</Typography>
                </div>
            </Cell>
            <Cell span={6} align={"middle"}>
                <Switch value={permission.manageAliases} onChange={handleOnChangeManageAliases} />
            </Cell>
        </Fragment>
    );
};
