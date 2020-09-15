import React, { Fragment, useEffect, useCallback, useReducer } from "react";
import { css } from "emotion";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Grid, Cell } from "@webiny/ui/Grid";
import { AdminAppPermissionRenderer } from "@webiny/app-admin/types";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Select } from "@webiny/ui/Select";
import { ReactComponent as HeadlessCMSIcon } from "../../icons/devices_other-black-24px.svg";
import { ReactComponent as HelpIcon } from "../../icons/help_outline.svg";
import { IconButton } from "@webiny/ui/Button";
import { ContentModelPermission } from "@webiny/app-headless-cms/admin/plugins/permissionRenderer/ContentModelPermission";
import { ContentGroupPermission } from "./ContentGroupPermission";
import { ContentEntryPermission } from "./ContentEntryPermission";
import { SecurityPermission } from "@webiny/app-security/SecurityIdentity";
import get from "lodash.get";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const gridClass = css({
    padding: "0px !important"
});

const gridNoPaddingHorizontalClass = css({
    padding: "16px 0px !important"
});

const flexClass = css({
    display: "flex",
    alignItems: "center"
});

const cmsPermission = "cms.*";

const permissionLevelOptions = [
    {
        id: 0,
        value: "#",
        label: "No Access"
    },
    {
        id: 1,
        value: cmsPermission,
        label: "Full Access"
    },
    {
        id: 2,
        value: cmsPermission + "#custom",
        label: "Custom Access"
    }
];

const actionTypes = {
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    SET_PERMISSION_LEVEL: "SET_PERMISSION_LEVEL",
    SYNC_PERMISSIONS: "SYNC_PERMISSIONS",
    RESET: "RESET"
};

const reducer = (currentState, action) => {
    switch (action.type) {
        case actionTypes.SET_PERMISSION_LEVEL:
            const isCustom = action.payload.includes("custom");
            const permissionName = action.payload.split("#")[0];

            return {
                ...currentState,
                permissionLevel: action.payload,
                showCustomPermission: isCustom,
                permission: {
                    ...currentState.permission,
                    name: permissionName
                },
                permissions: isCustom ? currentState.permissions : {}
            };
        case actionTypes.UPDATE_PERMISSION:
            const { key, value } = action.payload;
            return {
                ...currentState,
                permissions: { ...currentState.permissions, [key]: value }
            };
        case actionTypes.SYNC_PERMISSIONS:
            const hasFullAccess = action.payload.some(perm => perm.name === "*");
            const cmsPermissions = action.payload.filter(perm => perm.name.startsWith("cms"));

            if (cmsPermissions.length === 0 && !hasFullAccess) {
                return currentState;
            }

            if (hasFullAccess) {
                return {
                    ...currentState,
                    permissionLevel: cmsPermission
                };
            }

            let permissionLevel = currentState.permissionLevel;
            let permissions = currentState.permissions;
            let showCustomPermission = currentState.showCustomPermission;

            if (cmsPermissions.length === 1 && cmsPermissions[0].name === cmsPermission) {
                permissionLevel = cmsPermission;
            } else {
                showCustomPermission = true;
                permissionLevel = cmsPermission + "#custom";
                const obj = {};
                cmsPermissions.forEach(perm => {
                    obj[perm.name] = perm;
                });
                permissions = obj;
            }

            return {
                ...currentState,
                synced: true,
                permissionLevel,
                permissions,
                showCustomPermission,
                permission: { ...currentState.permission, name: cmsPermission }
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
    permission: { name: "" },
    permissions: {},
    showCustomPermission: false,
    synced: false
};

const PermissionLevel = ({ value, onChange }) => {
    const [
        { permissionLevel, showCustomPermission, permission, permissions, synced },
        dispatch
    ] = useReducer(reducer, initialState);
    // console.log("%cSTATE", "color: cyan; fontSize: 24px");
    // console.log({ permissionLevel, showCustomPermission, permission, permissions });

    useEffect(() => {
        if (value && !synced) {
            dispatch({ type: actionTypes.SYNC_PERMISSIONS, payload: value });
        }
    }, [value, permission]);

    // TODO: Adding a "Submit/Save" button will simplify things here.
    useEffect(() => {
        // Need to set permissions
        let cmsPermissions = [];

        if (permissions) {
            const customPermissions = Object.values(
                permissions
            ).filter((perm: SecurityPermission) => Boolean(perm && perm.name));

            if (customPermissions.length) {
                cmsPermissions = [...customPermissions];
            } else {
                cmsPermissions.push(permission);
            }
        }

        // If we have anything to set
        if (cmsPermissions.length) {
            onChange(cmsPermissions);
        }
    }, [permission, permissions]);

    const updatePermission = useCallback((key, value) => {
        dispatch({
            type: actionTypes.UPDATE_PERMISSION,
            payload: {
                key,
                value
            }
        });
    }, []);

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
                    <Grid className={gridNoPaddingHorizontalClass}>
                        <Cell span={12}>
                            <Typography use={"overline"}>{t`Content models and groups`}</Typography>
                        </Cell>
                        <ContentModelPermission value={permissions} setValue={updatePermission} />
                        <ContentGroupPermission value={permissions} setValue={updatePermission} />
                    </Grid>
                    <Grid className={gridNoPaddingHorizontalClass}>
                        <Cell span={12}>
                            <Typography use={"overline"}>{t`Records`}</Typography>
                        </Cell>
                        <ContentEntryPermission value={permissions} setValue={updatePermission} />
                    </Grid>
                </Fragment>
            )}
        </Fragment>
    );
};

export default () => [
    {
        type: "admin-app-permissions-renderer",
        name: "admin-app-permissions-renderer-cms",
        render({ key, ...props }) {
            // permissions: []
            return (
                <AccordionItem
                    key={key}
                    icon={<HeadlessCMSIcon />}
                    title={"Headless CMS"}
                    description={"Permissions for headless cms"}
                >
                    {/* We use key to unmount the component */}
                    <PermissionLevel
                        key={get(props, "form.state.data.id", key)}
                        {...props}

                    />
                </AccordionItem>
            );
        }
    } as AdminAppPermissionRenderer
];
