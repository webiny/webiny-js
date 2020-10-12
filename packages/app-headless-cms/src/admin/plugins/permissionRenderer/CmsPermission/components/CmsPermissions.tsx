import React, { Fragment, useEffect, useCallback, useReducer } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Select } from "@webiny/ui/Select";
import { IconButton } from "@webiny/ui/Button";
import { plugins } from "@webiny/plugins";
import { ReactComponent as HelpIcon } from "@webiny/app-headless-cms/admin/icons/help_outline.svg";
import { PermissionRendererCmsManage } from "@webiny/app-headless-cms/types";
import { PermissionRendererWrapper } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/CmsPermission/components/PermissionRendererWrapper";
import {
    flexClass,
    gridClass
} from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/components/StyledComponents";
import {
    reducer,
    initialState,
    actionTypes,
    permissionLevelOptions,
    PERMISSION_CMS_MANAGE_ALL
} from "../utils";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

export const CmsPermissions = ({ value, onChange }) => {
    const [
        { permissionLevel, showCustomPermission, permission, permissions, synced },
        dispatch
    ] = useReducer(reducer, initialState);
    // console.log("%cSTATE", "color: green; fontSize: 24px");
    // console.log({ permissionLevel, showCustomPermission, permission, permissions, synced });
    // console.log("value: ", value);

    useEffect(() => {
        if (value && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, synced]);

    const cmsPermissionRendererPlugins = plugins.byType<PermissionRendererCmsManage>(
        "permission-renderer-cms-manage"
    );

    const keys = cmsPermissionRendererPlugins.map(pl => pl.key);

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
                [PERMISSION_CMS_MANAGE_ALL]: initialState.permission
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
                [PERMISSION_CMS_MANAGE_ALL]: initialState.permission,
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
                    <div className={flexClass}>
                        <IconButton
                            icon={<HelpIcon />}
                            onClick={() => console.log("Show info...")}
                        />
                        <Typography use={"subtitle2"}>{t`Permission level`}</Typography>
                    </div>
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
                    {cmsPermissionRendererPlugins.map(pl => (
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
