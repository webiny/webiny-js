import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { useCmsData } from "./useCmsData.js";
import type { BindComponent } from "@webiny/form/types.js";
import type { CmsSecurityPermission } from "~/types.js";
import { CheckboxGroup, FormComponentNote, Grid, Select } from "@webiny/admin-ui";
import { PermissionsGroup } from "@webiny/app-admin";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface ContentModelGroupPermissionProps {
    Bind: BindComponent;
    data: CmsSecurityPermission;
    entity: string;
    title: string;
    disabled?: boolean;
}
const ContentModelGroupPermission = ({
    Bind,
    data,
    entity,
    title,
    disabled
}: ContentModelGroupPermissionProps) => {
    const modelsGroups = useCmsData();

    const endpoints = data.endpoints || [];

    const disabledPrimaryActions =
        [undefined, "own", "no"].includes(data[`${entity}AccessScope`]) ||
        !endpoints.includes("manage");

    return (
        <PermissionsGroup title={title}>
            <Grid>
                <Grid.Column span={12}>
                    <Bind name={`${entity}AccessScope`} defaultValue={"full"}>
                        <Select
                            label={t`Access Scope`}
                            disabled={disabled}
                            options={[
                                {
                                    value: "full",
                                    label: t`All groups`
                                },
                                {
                                    value: "groups",
                                    label: t`Only specific groups`
                                },
                                ...((endpoints.includes("manage") && [
                                    {
                                        value: "own",
                                        label: t`Only groups created by the user`
                                    }
                                ]) ||
                                    [])
                            ]}
                        />
                    </Bind>
                </Grid.Column>
                <>
                    {data[`${entity}AccessScope`] === "groups" && (
                        <Grid.Column span={12}>
                            <FormComponentNote
                                text={`Select the model user will be allowed to access.`}
                            />
                            {modelsGroups.groups.length === 0 ? (
                                <Bind name={`${entity}Props.groups`}>
                                    <></>
                                </Bind>
                            ) : (
                                <div className={"mt-md"}>
                                    <Bind name={`${entity}Props.groups`}>
                                        <CheckboxGroup
                                            items={modelsGroups.groups.map(item => {
                                                return {
                                                    value: item.id,
                                                    label: item.label,
                                                    disabled
                                                };
                                            })}
                                        />
                                    </Bind>
                                </div>
                            )}
                        </Grid.Column>
                    )}
                </>
                <Grid.Column span={12}>
                    <Bind name={`${entity}RWD`}>
                        <Select
                            label={t`Primary Actions`}
                            placeholder={"Read-only"}
                            disabled={disabled || disabledPrimaryActions}
                            options={[
                                {
                                    value: "r",
                                    label: t`Read-only`
                                },
                                ...(endpoints.includes("manage")
                                    ? [
                                          {
                                              value: "rw",
                                              label: t`Read, write`
                                          },
                                          {
                                              value: "rwd",
                                              label: t`Read, write, delete`
                                          }
                                      ]
                                    : [])
                            ]}
                        />
                    </Bind>
                </Grid.Column>
            </Grid>
        </PermissionsGroup>
    );
};

export default ContentModelGroupPermission;
