import React, { useEffect } from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { BindComponent } from "@webiny/form/types.js";
import { CheckboxGroup, FormComponentNote, Grid, Select } from "@webiny/admin-ui";
import { PermissionsGroup } from "@webiny/app-admin";

const t = i18n.ns("app-headless-cms/admin/plugins/permissionRenderer");

interface PermissionOption {
    id: string;
    name: string;
}
const pwOptions: PermissionOption[] = [
    { id: "p", name: t`Publish` },
    { id: "u", name: t`Unpublish` }
];

interface ContentEntryPermissionProps {
    Bind: BindComponent;
    data: Record<string, any>;
    entity: string;
    setValue: (name: string, value: string) => void;
    title: string;
    disabled?: boolean;
}
export const ContentEntryPermission = ({
    Bind,
    data,
    entity,
    setValue,
    title,
    disabled
}: ContentEntryPermissionProps) => {
    // Set "cms.contentEntry" access scope to "own" if "cms.contentModel" === "own".
    useEffect(() => {
        if (!data) {
            return;
        }
        if (data.contentModelAccessScope === "own" && data[`${entity}AccessScope`] !== "own") {
            setValue(`${entity}AccessScope`, "own");
        }
    }, [data]);

    const endpoints = data.endpoints || [];

    const disabledPrimaryActions =
        [undefined, "own", "no"].includes(data[`${entity}AccessScope`]) ||
        !endpoints.includes("manage");

    return (
        <PermissionsGroup title={title}>
            <Grid>
                <Grid.Column span={12}>
                    <Bind
                        defaultValue={"full"}
                        name={`${entity}AccessScope`}
                        beforeChange={(value, cb) => {
                            if (value === "own") {
                                setValue(`${entity}RWD`, "rwd");
                            }
                            cb(value);
                        }}
                    >
                        <Select
                            label={t`Access Scope`}
                            disabled={disabled || data[`contentModelAccessScope`] === "own"}
                            options={[
                                {
                                    value: "full",
                                    label: t`All entries`
                                },
                                ...((endpoints.includes("manage") && [
                                    {
                                        value: "own",
                                        label: t`Only entries created by the user`
                                    }
                                ]) ||
                                    [])
                            ]}
                        />
                    </Bind>
                    <>
                        {data[`contentModelAccessScope`] === "own" && (
                            <FormComponentNote>
                                <strong>Content Entry</strong>
                                &nbsp;{t`access depends upon`}&nbsp;
                                <strong>Content Model</strong>
                            </FormComponentNote>
                        )}
                    </>
                </Grid.Column>
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
                <>
                    {endpoints.includes("manage") && (
                        <Grid.Column span={12}>
                            <Bind name={`${entity}PW`}>
                                <CheckboxGroup
                                    label={t`Publishing actions`}
                                    description={t`Publishing-related actions that can be performed on content entries.`}
                                    items={pwOptions.map(({ id, name }) => ({
                                        value: id,
                                        label: name,
                                        disabled:
                                            disabled ||
                                            [undefined, "no"].includes(data[`${entity}AccessScope`])
                                    }))}
                                />
                            </Bind>
                        </Grid.Column>
                    )}
                </>
            </Grid>
        </PermissionsGroup>
    );
};
