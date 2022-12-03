import React, { Fragment, useCallback, useMemo } from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { i18n } from "@webiny/app/i18n";
import { PermissionInfo, gridNoPaddingClass } from "@webiny/app-admin/components/Permissions";
import { Form } from "@webiny/form";
import { Elevation } from "@webiny/ui/Elevation";
import { Typography } from "@webiny/ui/Typography";
import { Checkbox, CheckboxGroup } from "@webiny/ui/Checkbox";
import CustomSection from "./CustomSection";
import { SecurityPermission } from "@webiny/app-security/types";
import { PageBuilderSecurityPermission } from "~/types";

const t = i18n.ns("app-page-builder/admin/plugins/permissionRenderer");

const PAGE_BUILDER = "pb";
const PAGE_BUILDER_FULL_ACCESS = "pb.*";
const PAGE_BUILDER_SETTINGS_ACCESS = `${PAGE_BUILDER}.settings`;
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";
const ENTITIES = ["category", "menu", "page", "block"];

interface PwOptions {
    id: string;
    name: string;
}
const pwOptions: PwOptions[] = [
    { id: "p", name: t`Publish` },
    { id: "u", name: t`Unpublish` }
];

interface PageBuilderPermissionsProps {
    value: SecurityPermission;
    onChange: (value: SecurityPermission[]) => void;
}
export const PageBuilderPermissions: React.FC<PageBuilderPermissionsProps> = ({
    value,
    onChange
}) => {
    const onFormChange = useCallback(
        formData => {
            let newValue: SecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `pb*` permission objects, it's easier to build new ones from scratch.
                newValue = value.filter(item => !item.name.startsWith(PAGE_BUILDER));
            }

            if (formData.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (formData.accessLevel === FULL_ACCESS) {
                newValue.push({ name: PAGE_BUILDER_FULL_ACCESS });
                onChange(newValue);
                return;
            }

            // Handling custom access level.

            // Categories, menus, and pages first.
            ENTITIES.forEach(entity => {
                if (
                    formData[`${entity}AccessScope`] &&
                    formData[`${entity}AccessScope`] !== NO_ACCESS
                ) {
                    const permission: PageBuilderSecurityPermission = {
                        name: `${PAGE_BUILDER}.${entity}`,
                        rwd: "r"
                    };

                    if (formData[`${entity}AccessScope`] === "own") {
                        permission.own = true;
                        permission.rwd = "rwd";
                    } else if (formData[`${entity}RWD`]) {
                        permission.rwd = formData[`${entity}RWD`];
                    }

                    // For pages, we can also manage publishing and reviewing of pages.
                    if (entity === "page") {
                        // Set default publishing workflow value
                        permission.pw = "";
                        if (Array.isArray(formData[`${entity}PW`])) {
                            permission.pw = formData[`${entity}PW`].join("");
                        }
                    }

                    newValue.push(permission);
                }
            });

            // Settings.
            if (formData.settingsAccessLevel === FULL_ACCESS) {
                newValue.push({ name: PAGE_BUILDER_SETTINGS_ACCESS });
            }

            onChange(newValue);
        },
        [value]
    );

    const formData = useMemo(() => {
        if (!Array.isArray(value)) {
            return { accessLevel: NO_ACCESS };
        }

        const hasFullAccess = value.find(
            item => item.name === PAGE_BUILDER_FULL_ACCESS || item.name === "*"
        );
        if (hasFullAccess) {
            return { accessLevel: FULL_ACCESS };
        }

        const permissions = value.filter(item => item.name.startsWith(PAGE_BUILDER));
        if (!permissions.length) {
            return { accessLevel: NO_ACCESS };
        }

        // We're dealing with custom permissions. Let's first prepare data for "categories", "menus", and "pages".
        const formData = {
            accessLevel: CUSTOM_ACCESS,
            settingsAccessLevel: NO_ACCESS
        };

        ENTITIES.forEach(entity => {
            const data: Record<string, any> = {
                [`${entity}AccessScope`]: NO_ACCESS,
                [`${entity}RWD`]: "r"
            };

            const entityPermission = permissions.find(
                item => item.name === `${PAGE_BUILDER}.${entity}`
            );

            if (entityPermission) {
                data[`${entity}AccessScope`] = entityPermission.own ? "own" : FULL_ACCESS;
                if (entityPermission.rwd) {
                    data[`${entity}RWD`] = entityPermission.rwd;
                }

                // For pages, we can also manage publishing workflow.
                if (entity === "page") {
                    data[`${entity}PW`] = entityPermission.pw ? [...entityPermission.pw] : [];
                }
            }

            Object.assign(formData, data);
        });

        // Finally, let's prepare data for Page Builder settings.
        const hasSettingsAccess = permissions.find(
            item => item.name === PAGE_BUILDER_SETTINGS_ACCESS
        );
        if (hasSettingsAccess) {
            formData.settingsAccessLevel = FULL_ACCESS;
        }

        return formData;
    }, []);

    return (
        <Form data={formData} onChange={onFormChange}>
            {({ data, Bind, setValue }) => (
                <Fragment>
                    <Grid className={gridNoPaddingClass}>
                        <Cell span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"accessLevel"}>
                                <Select label={t`Access Level`}>
                                    <option value={NO_ACCESS}>{t`No access`}</option>
                                    <option value={FULL_ACCESS}>{t`Full access`}</option>
                                    <option value={CUSTOM_ACCESS}>{t`Custom access`}</option>
                                </Select>
                            </Bind>
                        </Cell>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && (
                        <Fragment>
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                setValue={setValue}
                                entity={"category"}
                                title={"Categories"}
                            />
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                setValue={setValue}
                                entity={"menu"}
                                title={"Menus"}
                            />

                            <CustomSection
                                data={data}
                                Bind={Bind}
                                setValue={setValue}
                                entity={"page"}
                                title={"Pages"}
                            >
                                <Cell span={12}>
                                    <Bind name={"pagePW"}>
                                        <CheckboxGroup
                                            label={t`Publishing actions`}
                                            description={t`Publishing-related actions that can be performed on the content.`}
                                        >
                                            {({ getValue, onChange }) =>
                                                pwOptions.map(({ id, name }) => (
                                                    <Checkbox
                                                        disabled={
                                                            !["full", "own"].includes(
                                                                data.pageAccessScope
                                                            )
                                                        }
                                                        key={id}
                                                        label={name}
                                                        value={getValue(id)}
                                                        onChange={onChange(id)}
                                                    />
                                                ))
                                            }
                                        </CheckboxGroup>
                                    </Bind>
                                </Cell>
                            </CustomSection>
                            <CustomSection
                                data={data}
                                Bind={Bind}
                                setValue={setValue}
                                entity={"block"}
                                title={"Block content"}
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
