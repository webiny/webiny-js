import React, { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader,
    Permissions,
    EmptyView,
    useRouter,
    useSnackbar
} from "@webiny/app-admin";
import { CREATE_ROLE, LIST_ROLES, READ_ROLE, UPDATE_ROLE } from "./graphql.js";
import isEmpty from "lodash/isEmpty.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { Role } from "~/types.js";
import {
    Alert,
    Button,
    Grid,
    IconButton,
    Input,
    OverlayLoader,
    Textarea,
    Tooltip
} from "@webiny/admin-ui";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-security/admin/roles/form");

export interface RolesFormProps {
    newEntry: boolean;
    id: string | undefined;
}

export const RolesForm = ({ id, newEntry }: RolesFormProps) => {
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();

    const getQuery = useQuery(READ_ROLE, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.group;
            if (error) {
                goToRoute(Routes.Roles.List);
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_ROLE, {
        refetchQueries: [{ query: LIST_ROLES }]
    });

    const [update, updateMutation] = useMutation(UPDATE_ROLE, {
        refetchQueries: [{ query: LIST_ROLES }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async ({ id, name, description, slug, permissions, createdOn }: Role) => {
            if (!permissions || !permissions.length) {
                showSnackbar(t`You must configure permissions before saving!`, {
                    timeout: 60000,
                    dismissesOnAction: true
                });
                return;
            }

            const isUpdate = createdOn;
            const [operation, args] = isUpdate
                ? [
                      update,
                      {
                          variables: {
                              id,
                              data: {
                                  name,
                                  permissions,
                                  ...(description && { description })
                              }
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: {
                                  name,
                                  slug,
                                  description,
                                  permissions
                              }
                          }
                      }
                  ];

            const response = await operation(args);

            const { data: group, error } = response.data.security.group;
            if (error) {
                return showSnackbar(error.message);
            }

            if (!isUpdate) {
                goToRoute(Routes.Roles.List, { id: group.id });
            }
            showSnackbar(t`Role saved successfully!`);
        },
        [id]
    );

    const data: Role = loading ? {} : get(getQuery, "data.security.group.data", {});

    const systemRole = data.slug === "full-access" || data.system;
    const pluginRole = data.plugin;
    const canModifyRole = !systemRole && !pluginRole;

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                icon={<SettingsIcon />}
                title={t`Click on the left side list to display role details or create a...`}
                action={
                    <Button
                        icon={<AddIcon />}
                        text={t`New Role`}
                        data-testid="new-record-button"
                        onClick={() => {
                            goToRoute(Routes.Roles.List, { new: true });
                        }}
                    />
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => {
                return (
                    <SimpleForm size={"lg"}>
                        {loading && <OverlayLoader />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <Grid>
                                <>
                                    {pluginRole && (
                                        <Grid.Column span={12}>
                                            <Alert
                                                type={"warning"}
                                                title={"Permissions are locked"}
                                            >
                                                This role is registered via an extension, and cannot
                                                be modified.
                                            </Alert>
                                        </Grid.Column>
                                    )}
                                    <Grid.Column span={6}>
                                        <Bind
                                            name="name"
                                            validators={validation.create("required,minLength:3")}
                                        >
                                            <Input
                                                size={"lg"}
                                                label={t`Name`}
                                                disabled={!canModifyRole}
                                                data-testid="admin.am.group.new.name"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={6}>
                                        <Bind
                                            name="slug"
                                            validators={validation.create("required,minLength:3")}
                                        >
                                            <Input
                                                size={"lg"}
                                                disabled={!canModifyRole || !newEntry}
                                                label={t`Slug`}
                                                data-testid="admin.am.group.new.slug"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name="description"
                                            validators={validation.create("maxLength:500")}
                                        >
                                            <Textarea
                                                size={"lg"}
                                                label={t`Description`}
                                                rows={3}
                                                disabled={!canModifyRole}
                                                data-testid="admin.am.group.new.description"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                </>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormHeader title={"Permissions"} rounded={false}>
                            <div className={"flex justify-end"}>
                                <Tooltip
                                    content="Copy permissions as JSON"
                                    trigger={
                                        <IconButton
                                            variant={"ghost"}
                                            icon={<CopyIcon />}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    JSON.stringify(data.permissions, null, 2)
                                                );
                                                showSnackbar("JSON data copied to clipboard.");
                                            }}
                                        />
                                    }
                                />
                            </div>
                        </SimpleFormHeader>
                        <SimpleFormContent>
                            {systemRole && (
                                <Grid.Column span={12}>
                                    <Alert type={"warning"} title={"Permissions are locked"}>
                                        This is a protected system role and you can&apos;t modify
                                        its permissions.
                                    </Alert>
                                </Grid.Column>
                            )}
                            <Grid>
                                <>
                                    {canModifyRole && (
                                        <Grid.Column span={12}>
                                            <Bind name={"permissions"} defaultValue={[]}>
                                                {bind => (
                                                    <Permissions id={data.id || "new"} {...bind} />
                                                )}
                                            </Bind>
                                        </Grid.Column>
                                    )}
                                </>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            {canModifyRole && (
                                <>
                                    <Button
                                        variant={"secondary"}
                                        text={t`Cancel`}
                                        onClick={() => {
                                            goToRoute(Routes.Roles.List);
                                        }}
                                        data-testid="pb.category.new.form.button.cancel"
                                    />
                                    <Button
                                        text={t`Save`}
                                        data-testid="admin.am.group.new.save"
                                        onClick={ev => {
                                            form.submit(ev);
                                        }}
                                    />
                                </>
                            )}
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};
