import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import {
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-security-user-management/components/permission";
import { Form } from "@webiny/form";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import CustomSection from "./CustomSection";
const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

export const PageBuilderPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `page-builder*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith("page-builder"));
            }

            if (data.accessLevel === "no") {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === "full") {
                newValue.push({ name: "page-builder.*" });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Categories, menus, and pages first.
            ["categories", "menus", "pages"].forEach(entity => {
                if (data[`${entity}AccessLevel`] !== "no") {
                    const permission = {
                        name: `page-builder.${entity}`,
                        own: false,
                        permissions: undefined
                    };

                    if (data[`${entity}AccessLevel`] === "own") {
                        permission.own = true;
                    } else {
                        permission.permissions = data[`${entity}Permissions`];
                    }
                    newValue.push(permission);
                }
            });

            // Settings second.
            if (data.settingsAccessLevel === "full") {
                newValue.push({ name: "page-builder.settings" });
            }

            onChange(newValue);
        },
        [securityGroup.id]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: "no" };
        }

        const permissions = value.filter(item => item.name.startsWith("page-builder"));
        if (!permissions.length) {
            return { accessLevel: "no" };
        }

        if (permissions.length === 1 && permissions[0].name === "page-builder.*") {
            return { accessLevel: "full" };
        }

        // We're dealing with custom permissions. Let's first prepare data for "categories", "menus", and "pages".
        const returnData = { accessLevel: "custom", settingsAccessLevel: "no" };
        ["categories", "menus", "pages"].forEach(entity => {
            const data = {
                [`${entity}AccessLevel`]: "no",
                [`${entity}Permissions`]: "r"
            };

            const entityPermission = permissions.find(
                item => item.name === `page-builder.${entity}`
            );
            if (entityPermission) {
                data[`${entity}AccessLevel`] = entityPermission.own ? "own" : "full";
                if (data[`${entity}AccessLevel`] === "full") {
                    data[`${entity}Permissions`] = entityPermission.permissions;
                }
            }

            Object.assign(returnData, data);
        });

        // Finally, let's prepare data for Page Builder settings.
        const hasSettingsAccess = permissions.find(item => item.name === "page-builder.settings");
        if (hasSettingsAccess) {
            returnData.settingsAccessLevel = "full";
        }

        return returnData;
    }, [securityGroup.id]);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"accessLevel"}>
                                <Select label={t`Access Level`}>
                                    <option value={"no"}>{t`No access`}</option>
                                    <option value={"full"}>{t`Full Access`}</option>
                                    <option value={"custom"}>{t`Custom Access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === "custom" && (
                        <Fragment>
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                entity={"categories"}
                                title={"Categories"}
                            />
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                entity={"menus"}
                                title={"Menus"}
                            />
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                entity={"pages"}
                                title={"Pages"}
                            />
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Settings`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage settings`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"settingsAccessLevel"}>
                                                    <Select label={t`Access Level`}>
                                                        <option value={"no"}>{t`No access`}</option>
                                                        <option
                                                            value={"full"}
                                                        >{t`Full Access`}</option>
                                                    </Select>
                                                </Bind>
                                            </Cell>
                                        </Grid>
                                    </Cell>
                                </Grid>
                            </Elevation>
                        </Fragment>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
