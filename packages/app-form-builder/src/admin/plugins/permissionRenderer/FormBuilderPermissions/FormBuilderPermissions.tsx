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

import FormPermission from "./FormPermission";
import FormSubmissionPermission from "./FormSubmissionPermission";

const t = i18n.ns("app-form-builder/admin/plugins/permissionRenderer");

const FORM_BUILDER = "forms";
const FORM_BUILDER_FULL_ACCESS = `${FORM_BUILDER}.*`;
const FORM_BUILDER_SETTINGS = `${FORM_BUILDER}.settings`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";
const ENTITIES = ["forms", "submissions"];

export const FormBuilderPermissions = ({ securityGroup, value, onChange }) => {
    const onFormChange = useCallback(
        data => {
            let newValue = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `form-builder*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(FORM_BUILDER));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({ name: FORM_BUILDER_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Forms and submissions first.
            ENTITIES.forEach(entity => {
                if (data[`${entity}AccessLevel`] !== NO_ACCESS) {
                    const permission = {
                        name: `${FORM_BUILDER}.${entity}`,
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
            if (data.settingsAccessLevel === FULL_ACCESS) {
                newValue.push({ name: FORM_BUILDER_SETTINGS });
            }

            onChange(newValue);
        },
        [securityGroup.id]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const fullAccessPermission = value.find(
            item => item.name === FORM_BUILDER_FULL_ACCESS || item.name === "*"
        );
        if (fullAccessPermission) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(FORM_BUILDER));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        // We're dealing with custom permissions. Let's first prepare data for "forms" and "submissions".
        const returnData = { accessLevel: CUSTOM_ACCESS, settingsAccessLevel: NO_ACCESS };
        ENTITIES.forEach(entity => {
            const data = {
                [`${entity}AccessLevel`]: NO_ACCESS,
                [`${entity}Permissions`]: "r"
            };

            const entityPermission = permissions.find(
                item => item.name === `${FORM_BUILDER}.${entity}`
            );
            if (entityPermission) {
                data[`${entity}AccessLevel`] = entityPermission.own ? "own" : FULL_ACCESS;
                if (data[`${entity}AccessLevel`] === FULL_ACCESS) {
                    data[`${entity}Permissions`] = entityPermission.permissions;
                }
            }

            Object.assign(returnData, data);
        });

        const hasSettingsAccess = permissions.find(item => item.name === FORM_BUILDER_SETTINGS);
        if (hasSettingsAccess) {
            returnData.settingsAccessLevel = FULL_ACCESS;
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
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full Access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom Access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && (
                        <Fragment>
                            <FormPermission
                                Bind={Bind}
                                data={data}
                                entity={"forms"}
                                title={"Form"}
                            />
                            <FormSubmissionPermission
                                Bind={Bind}
                                data={data}
                                entity={"submissions"}
                                title={"Form Submission"}
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
                                                        <option
                                                            value={NO_ACCESS}
                                                        >{t`No access`}</option>
                                                        <option
                                                            value={FULL_ACCESS}
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
