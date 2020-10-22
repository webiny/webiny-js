import React, { Fragment, useCallback, useMemo } from "react";
import isEmpty from "lodash/isEmpty";
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
import CustomSection from "./components/CustomSection";
import { ContentModelPermission } from "./components/ContentModelPermission";
import { ContentEntryPermission } from "./components/ContentEntryPermission";
import { EnvironmentPermission } from "./components/EnvironmentPermission";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

const CMS = "cms";
const CMS_FULL_ACCESS = "cms.*";

export const CMSPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `cms*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(CMS));
            }

            if (data.accessLevel === "no") {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === "full") {
                newValue.push({ name: CMS_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Content models, content model groups, content entries and environments first.
            ["contentModels", "contentModelGroups", "contentEntries", "environments"].forEach(
                entity => {
                    if (data[`${entity}AccessLevel`] !== "no") {
                        const permission = {
                            name: `${CMS}.${entity}`,
                            own: false,
                            permissions: undefined,
                            props: undefined
                        };

                        if (data[`${entity}AccessLevel`] === "own") {
                            permission.own = true;
                        } else {
                            permission.permissions = data[`${entity}Permissions`];
                            permission.props = data[`${entity}Props`];
                        }
                        newValue.push(permission);
                    }
                }
            );

            // Settings second.
            if (data.aliasesSettingsAccessLevel === "full") {
                newValue.push({ name: "cms.settings.aliases" });
            }
            if (data.environmentsSettingsAccessLevel === "full") {
                newValue.push({ name: "cms.settings.environments" });
            }

            onChange(newValue);
        },
        [securityGroup.id]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: "no" };
        }

        const permissions = value.filter(item => item.name.startsWith(CMS));
        if (!permissions.length) {
            return { accessLevel: "no" };
        }

        if (permissions.length === 1 && permissions[0].name === CMS_FULL_ACCESS) {
            return { accessLevel: "full" };
        }

        // We're dealing with custom permissions. Let's first prepare data for "content models", "content model groups", "content entries" and "environments".
        const returnData = {
            accessLevel: "custom",
            environmentsSettingsAccessLevel: "no",
            aliasesSettingsAccessLevel: "no"
        };
        ["contentModels", "contentModelGroups", "contentEntries", "environments"].forEach(
            entity => {
                const data = {
                    [`${entity}AccessLevel`]: "no",
                    [`${entity}Permissions`]: "r"
                };

                const entityPermission = permissions.find(item => item.name === `${CMS}.${entity}`);
                if (entityPermission) {
                    data[`${entity}AccessLevel`] = entityPermission.own ? "own" : "full";
                    if (data[`${entity}AccessLevel`] === "full") {
                        data[`${entity}Permissions`] = entityPermission.permissions;
                        data[`${entity}Props`] = entityPermission.props;
                    }
                    // If there are any non-empty props We'll set "AccessLevel" to that prop.
                    if (entityPermission.props) {
                        let accessLevel;
                        Object.keys(entityPermission.props).forEach(key => {
                            if (!isEmpty(entityPermission.props[key])) {
                                accessLevel = key;
                            }
                        });
                        if (accessLevel) {
                            data[`${entity}AccessLevel`] = accessLevel;
                        }
                    }
                }

                Object.assign(returnData, data);
            }
        );

        // Finally, let's prepare data for Headless CMS settings.
        const hasAliasesSettingsAccess = permissions.find(
            item => item.name === `${CMS}.settings.aliases`
        );
        if (hasAliasesSettingsAccess) {
            returnData.aliasesSettingsAccessLevel = "full";
        }
        const hasEnvironmentsSettingsAccess = permissions.find(
            item => item.name === `${CMS}.settings.environments`
        );
        if (hasEnvironmentsSettingsAccess) {
            returnData.environmentsSettingsAccessLevel = "full";
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
                            <ContentModelPermission
                                data={data}
                                Bind={Bind}
                                entity={"contentModels"}
                                title={"Content Models"}
                            />
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                entity={"contentModelGroups"}
                                title={"Content Model Groups"}
                            />
                            <ContentEntryPermission
                                data={data}
                                Bind={Bind}
                                entity={"contentEntries"}
                                title={"Content Entries"}
                            />
                            <EnvironmentPermission
                                data={data}
                                Bind={Bind}
                                entity={"environments"}
                            />
                            <Elevation z={1} style={{ marginTop: 10 }}>
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"overline"}>{t`Settings`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage environments`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"environmentsSettingsAccessLevel"}>
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
                                    <Cell span={12}>
                                        <Grid style={{ padding: 0, paddingBottom: 24 }}>
                                            <Cell span={6}>
                                                <PermissionInfo title={t`Manage aliases`} />
                                            </Cell>
                                            <Cell span={6} align={"middle"}>
                                                <Bind name={"aliasesSettingsAccessLevel"}>
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
