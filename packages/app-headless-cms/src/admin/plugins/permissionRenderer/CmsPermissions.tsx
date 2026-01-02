/**
 * @pavel Please review types for security permissions
 * TODO @ts-refactor
 */
import React, { useCallback, useMemo } from "react";
import ContentModelGroupPermission from "./components/ContentModelGroupPermission.js";
import { i18n } from "@webiny/app/i18n/index.js";
import {
    CannotUseAaclAlert,
    PermissionInfo,
    gridWithPaddingClass,
    SimpleLink,
    AaclPermission
} from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { ContentModelPermission } from "./components/ContentModelPermission.js";
import { ContentEntryPermission } from "./components/ContentEntryPermission.js";
import type { CmsSecurityPermission } from "~/types.js";
import { useSecurity } from "@webiny/app-admin";
import { CheckboxGroup, Grid, Select } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

const CMS_PERMISSION = "cms";
const CMS_PERMISSION_FULL_ACCESS = "cms.*";
const FULL_ACCESS = "full";
const NO_ACCESS = "no";
const CUSTOM_ACCESS = "custom";
const ENTITIES = ["contentModel", "contentModelGroup", "contentEntry"];
const API_ENDPOINTS = [
    { id: "read", name: "Read" },
    { id: "manage", name: "Manage" },
    { id: "preview", name: "Preview" }
];

const GRAPHQL_API_TYPES_LINK =
    "https://www.webiny.com/docs/key-topics/webiny-applications/headless-cms/graphql-api/#graphql-api-types";

export interface CMSPermissionsProps {
    value: CmsSecurityPermission[];
    onChange: (value: CmsSecurityPermission[]) => void;
}

export const CMSPermissions = ({ value, onChange }: CMSPermissionsProps) => {
    const { getPermission } = useSecurity();

    // We disable form elements for custom permissions if AACL cannot be used.
    const cannotUseAAcl = useMemo(() => {
        return !getPermission<AaclPermission>("aacl", true);
    }, []);

    const canRead = useCallback((value: any[], permissionName: string) => {
        const permission = value.find(item => item.name === permissionName);

        if (!permission) {
            return false;
        }

        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd.includes("r");
    }, []);

    const onFormChange = useCallback(
        (data: CmsSecurityPermission) => {
            let newValue: CmsSecurityPermission[] = [];
            if (Array.isArray(value)) {
                // Let's just filter out the `cms*` permission objects.
                // Based on the `data` we rebuild new permission object from scratch.
                newValue = value.filter(item => !item.name.startsWith(CMS_PERMISSION));
            }

            if (data.accessLevel === NO_ACCESS) {
                onChange(newValue);
                return;
            }

            if (data.accessLevel === FULL_ACCESS) {
                newValue.push({
                    name: CMS_PERMISSION_FULL_ACCESS
                });
                onChange(newValue);
                return;
            }

            const endpoints = data.endpoints;

            // Handling custom access level.
            if (endpoints && Array.isArray(data.endpoints)) {
                API_ENDPOINTS.forEach(api => {
                    if (endpoints.includes(api.id)) {
                        newValue.push({
                            name: `${CMS_PERMISSION}.endpoint.${api.id}`
                        });
                    }
                });
            }

            // Content models, content model groups, content entries
            ENTITIES.forEach(entity => {
                const accessScope = data[`${entity}AccessScope`];
                if (accessScope && accessScope !== NO_ACCESS) {
                    const permission: CmsSecurityPermission = {
                        name: `${CMS_PERMISSION}.${entity}`,
                        own: false,
                        rwd: "r",
                        pw: "",
                        groups: undefined,
                        models: undefined
                    };

                    if (accessScope === "own") {
                        permission.own = true;
                        permission.rwd = "rwd";
                    } else {
                        permission.rwd = data[`${entity}RWD`] || "r";
                    }

                    permission.pw = (data[`${entity}PW`] || []).join("");

                    if (accessScope === "models") {
                        permission.models = {};
                    }

                    if (accessScope === "groups") {
                        permission.groups = {};
                    }

                    const props = data[`${entity}Props`];
                    if (props) {
                        ["models", "groups"].forEach(entity => {
                            if (accessScope === entity && props[entity]) {
                                permission[entity] = props[entity];
                            }
                        });
                    }

                    newValue.push(permission);
                }
            });
            // Remove dependent permissions.
            // The "cms.contentModel" permission can only be assigned if the user has the "read" access for the "cms.contentModelGroup".
            if (!canRead(newValue, "cms.contentModelGroup")) {
                newValue = newValue.filter(item => item.name !== "cms.contentModel");
            }
            // The "cms.contentEntry" permission can only be assigned if the user has the "read" access for the "cms.contentModel".
            if (!canRead(newValue, "cms.contentModel")) {
                newValue = newValue.filter(item => item.name !== "cms.contentEntry");
            }

            onChange(newValue);
        },
        [value]
    );

    const initialFormData = useMemo(() => {
        // This function only runs once on Form mount
        if (!Array.isArray(value)) {
            return {
                accessLevel: NO_ACCESS
            };
        }

        const hasFullAccess = value.some(
            item => item.name === CMS_PERMISSION_FULL_ACCESS || item.name === "*"
        );

        if (hasFullAccess) {
            return {
                accessLevel: FULL_ACCESS,
                endpoints: API_ENDPOINTS.map(item => item.id)
            };
        }

        const permissions = value.filter(item => item.name.startsWith(CMS_PERMISSION));

        if (!permissions.length) {
            return {
                accessLevel: NO_ACCESS
            };
        }

        // We're dealing with custom permissions. Let's first prepare data for "content models", "content model groups", "content entries" and "environments".
        const returnData = {
            accessLevel: CUSTOM_ACCESS,
            endpoints: permissions
                .filter(p => p.name.startsWith("cms.endpoint."))
                .map(p => p.name.replace("cms.endpoint.", ""))
        };

        ENTITIES.forEach(entity => {
            const data: Record<string, any> = {
                [`${entity}AccessScope`]: FULL_ACCESS,
                [`${entity}RWD`]: "r",
                [`${entity}Props`]: {}
            };

            const entityPermission = permissions.find(
                item => item.name === `${CMS_PERMISSION}.${entity}`
            );

            if (entityPermission) {
                data[`${entity}AccessScope`] = entityPermission.own ? "own" : FULL_ACCESS;
                if (data[`${entity}AccessScope`] === "own") {
                    data[`${entity}RWD`] = "rwd";
                } else {
                    data[`${entity}RWD`] = entityPermission.rwd;
                }

                // If there are any non-empty props we'll set "AccessScope" to that prop.
                if (entityPermission.models) {
                    data[`${entity}AccessScope`] = "models";
                    data[`${entity}Props`] = { models: entityPermission.models };
                }

                if (entityPermission.groups) {
                    data[`${entity}AccessScope`] = "groups";
                    data[`${entity}Props`] = { groups: entityPermission.groups };
                }

                if (entity === "contentEntry") {
                    data[`${entity}PW`] = entityPermission.pw ? entityPermission.pw.split("") : [];
                }
            }

            Object.assign(returnData, data);
        });

        return returnData;
    }, []) as CmsSecurityPermission;

    const getSelectedContentModelGroups = useCallback((data: CmsSecurityPermission) => {
        if (data && data.contentModelGroupAccessScope === "groups" && data.contentModelGroupProps) {
            return data.contentModelGroupProps.groups;
        }
    }, []);

    return (
        <Form<CmsSecurityPermission> data={initialFormData} onChange={onFormChange}>
            {({ data, Bind, setValue }) => (
                <>
                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={12}>
                            {data.accessLevel === "custom" && cannotUseAAcl && (
                                <CannotUseAaclAlert />
                            )}
                        </Grid.Column>
                    </Grid>

                    <Grid className={gridWithPaddingClass}>
                        <Grid.Column span={6}>
                            <PermissionInfo title={t`Access Level`} />
                        </Grid.Column>
                        <Grid.Column span={6}>
                            <Bind name={"accessLevel"}>
                                <Select
                                    options={[
                                        {
                                            value: NO_ACCESS,
                                            label: t`No access`
                                        },
                                        {
                                            value: FULL_ACCESS,
                                            label: t`Full access`
                                        },
                                        {
                                            value: CUSTOM_ACCESS,
                                            label: t`Custom access`
                                        }
                                    ]}
                                />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                    {data.accessLevel === CUSTOM_ACCESS && (
                        <div className={"mt-lg"}>
                            <div className={"mb-md"}>
                                <Grid>
                                    <Grid.Column span={12}>
                                        <Bind name={"endpoints"}>
                                            {bind => (
                                                <CheckboxGroup
                                                    {...bind}
                                                    label={t`GraphQL API types`}
                                                    description={t`Each type has a separate URL and a specific purpose.
                                                 Check out the {link} key topic to learn more.`({
                                                        link: (
                                                            <SimpleLink
                                                                to={GRAPHQL_API_TYPES_LINK}
                                                                target={"_blank"}
                                                            >
                                                                Headless CMS GraphQL API
                                                            </SimpleLink>
                                                        )
                                                    })}
                                                    items={API_ENDPOINTS.map(({ id, name }) => ({
                                                        id,
                                                        label: name,
                                                        value: id
                                                    }))}
                                                />
                                            )}
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </div>

                            <ContentModelGroupPermission
                                data={data}
                                Bind={Bind}
                                disabled={cannotUseAAcl}
                                entity={"contentModelGroup"}
                                title={"Content Model Groups"}
                            />

                            <ContentModelPermission
                                data={data}
                                setValue={setValue}
                                Bind={Bind}
                                disabled={cannotUseAAcl}
                                entity={"contentModel"}
                                title={"Content Models"}
                                selectedContentModelGroups={getSelectedContentModelGroups(data)}
                            />

                            <ContentEntryPermission
                                data={data}
                                Bind={Bind}
                                disabled={cannotUseAAcl}
                                setValue={setValue}
                                entity={"contentEntry"}
                                title={"Content Entries"}
                            />
                        </div>
                    )}
                </>
            )}
        </Form>
    );
};
