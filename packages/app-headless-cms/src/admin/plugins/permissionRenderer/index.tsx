import React, { useEffect, useState, Fragment, useCallback } from "react";
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

const PermissionLevel = props => {
    const [value, setValue] = useState(() => ({
        name: ""
    }));
    const [permission, setPermission] = useState("#");
    const [permissions, setPermissions] = useState({});
    const [showCustomPermission, setShowCustomPermission] = useState(false);

    const [dirty, setDirty] = useState(false);

    // Sync back the data
    useEffect(() => {
        // FIXME: I'm not very sure about this approach
        if (props.value && !dirty) {
            const allCMSPermissions = props.value.filter(perm => perm.name.startsWith("cms"));

            if (allCMSPermissions.length === 1 && allCMSPermissions[0].name === cmsPermission) {
                setPermission(cmsPermission);
            } else if (allCMSPermissions.length) {
                setPermission(cmsPermission + "#custom");
                const obj = {};
                allCMSPermissions.forEach(perm => {
                    obj[perm.name] = perm;
                });
                setPermissions(obj);
            }
        }
    }, [props.value, dirty]);

    useEffect(() => {
        const isCustom = permission.includes("custom");
        setShowCustomPermission(isCustom);

        const permissionName = permission.split("#")[0];
        // Set default permission
        setValue(value => ({
            ...value,
            name: permissionName
        }));
        //  Reset customPermissions
        if (!isCustom) {
            setPermissions({});
        }

        if (permissionName === cmsPermission && !dirty) {
            setDirty(true);
        }
    }, [permission]);

    const addPermission = useCallback(
        ({ permission, key }: { permission: SecurityPermission; key: string }) => {
            if (!key) {
                console.warn(`Missing "key" in [addPermission] call.`);
            }

            setPermissions(perms => ({ ...perms, [key]: permission }));
        },
        [permissions]
    );

    useEffect(() => {
        // Need to set permissions
        let cmsPermissions = [];

        if (permissions) {
            const customPermissions = Object.values(
                permissions
            ).filter((perm: SecurityPermission) => Boolean(perm && perm.name));

            if (customPermissions.length) {
                cmsPermissions = [...customPermissions];
            }
        }
        // If there are no customPermissions
        if (!cmsPermissions.length && value) {
            cmsPermissions.push(value);
        }
        // If we have anything to set
        if (cmsPermissions.length) {
            props.onChange(cmsPermissions);
        }
    }, [value, permissions]);

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
                        value={permission}
                        onChange={value => setPermission(value)}
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
                        <ContentModelPermission addPermission={addPermission} />
                        <ContentGroupPermission addPermission={addPermission} />
                    </Grid>
                    <Grid className={gridNoPaddingHorizontalClass}>
                        <Cell span={12}>
                            <Typography use={"overline"}>{t`Records`}</Typography>
                        </Cell>
                        <ContentEntryPermission addPermission={addPermission} />
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
            return (
                <AccordionItem
                    key={key}
                    icon={<HeadlessCMSIcon />}
                    title={"Headless CMS"}
                    description={"Permissions for headless cms"}
                >
                    <PermissionLevel {...props} />
                </AccordionItem>
            );
        }
    } as AdminAppPermissionRenderer
];
