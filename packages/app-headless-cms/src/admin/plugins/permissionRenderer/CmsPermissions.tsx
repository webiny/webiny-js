import React, { Fragment, useCallback, useMemo } from "react";
import isEmpty from "lodash/isEmpty";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import {
    PermissionInfo,
    gridNoPaddingClass
} from "@webiny/app-security-tenancy/components/permission";
import { Form } from "@webiny/form";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import CustomSection from "./components/CustomSection";
import { ContentModelPermission } from "./components/ContentModelPermission";
import { ContentEntryPermission } from "./components/ContentEntryPermission";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

// Here "manage" represents the "MANAGE API"
const CMS_MANAGE = "cms.manage";
const CMS_MANAGE_FULL_ACCESS = "cms.manage.*";
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";
const ENTITIES = ["contentModels", "contentModelGroups", "contentEntries"];

export const CMSPermissions = ({ parent, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `cms*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(CMS_MANAGE));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: CMS_MANAGE_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Content models, content model groups, content entries and environments first.
            ENTITIES.forEach(entity => {
                if (data[`${entity}AccessLevel`] && data[`${entity}AccessLevel`] !== NO_ACCESS) {
                    const permission = {
                        name: `${CMS_MANAGE}.${entity}`,
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
            });
            
            onChange(newValue);
        },
        [parent.id, value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === CMS_MANAGE_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(CMS_MANAGE));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        // We're dealing with custom permissions. Let's first prepare data for "content models", "content model groups", "content entries" and "environments".
        const returnData = {
            accessLevel: CUSTOM_ACCESS,
            environmentsSettingsAccessLevel: NO_ACCESS,
            aliasesSettingsAccessLevel: NO_ACCESS
        };
        ENTITIES.forEach(entity => {
            const data = {
                [`${entity}AccessLevel`]: NO_ACCESS,
                [`${entity}Permissions`]: "r"
            };

            const entityPermission = permissions.find(
                item => item.name === `${CMS_MANAGE}.${entity}`
            );
            if (entityPermission) {
                data[`${entity}AccessLevel`] = entityPermission.own ? "own" : FULL_ACCESS;
                if (data[`${entity}AccessLevel`] === FULL_ACCESS) {
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
        });

        return returnData;
    }, [parent.id]);

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
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full Access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom Access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && (
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
                        </Fragment>
                    )}
                </Fragment>
            )}
        </Form>
    );
};
