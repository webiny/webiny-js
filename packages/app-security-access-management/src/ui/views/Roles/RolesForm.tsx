import React, { useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Bind, Form, useForm, useGenerateSlug } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    EmptyView,
    Permissions,
    SimpleForm,
    SimpleFormContent,
    SimpleFormFooter,
    SimpleFormHeader,
    useRouter,
    useSnackbar
} from "@webiny/app-admin";
import {
    CREATE_ROLE,
    type ICreateRoleResponse,
    type IReadRoleResponse,
    type IUpdateRoleResponse,
    LIST_ROLES,
    READ_ROLE,
    UPDATE_ROLE
} from "./graphql.js";
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

    const getQuery = useQuery<IReadRoleResponse>(READ_ROLE, {
        variables: { id },
        skip: !id,
        // onCompleted: data => {
        //     if (!data) {
        //         return;
        //     }
        //
        //     const { error } = data.security.role;
        //     if (!error) {
        //         return;
        //     }
        //     goToRoute(Routes.Roles.List);
        //     showSnackbar(error.message);
        // }
    });
    /**
     * Replaces the onCompleted callback of the useQuery hook
     */
    useEffect(() => {
        if (!getQuery.data) {
            return;
        }
        
        const { error } = getQuery.data.security.role;
        if (!error) {
            return;
        }
        goToRoute(Routes.Roles.List);
        showSnackbar(error.message);
    }, [getQuery.data, goToRoute, showSnackbar]);

    const [create, createMutation] = useMutation<ICreateRoleResponse>(CREATE_ROLE, {
        refetchQueries: [{ query: LIST_ROLES }]
    });

    const [update, updateMutation] = useMutation<IUpdateRoleResponse>(UPDATE_ROLE, {
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

            const { data: role, error } = response.data!.security.role;
            if (error) {
                return showSnackbar(error.message);
            }

            if (!isUpdate) {
                goToRoute(Routes.Roles.List, { id: role!.id });
            }
            showSnackbar(t`Role saved successfully!`);
        },
        [id]
    );

    const data: Partial<Role> = loading ? {} : get(getQuery, "data.security.role.data", {});

    const systemRole = data.slug === "full-access" || data.system;
    const pluginRole = data.plugin ?? false;
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
                            <FormContent
                                pluginRole={pluginRole}
                                canModifyRole={canModifyRole}
                                newEntry={newEntry}
                            />
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
                                        data-testid="admin.am.role.new.save"
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

interface FormContentProps {
    pluginRole: boolean;
    canModifyRole: boolean;
    newEntry: boolean;
}

const FormContent = (props: FormContentProps) => {
    const { pluginRole, canModifyRole, newEntry } = props;
    const form = useForm();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");

    return (
        <Grid>
            <>
                {pluginRole && (
                    <Grid.Column span={12}>
                        <Alert type={"warning"} title={"Permissions are locked"}>
                            This role is registered via an extension, and cannot be modified.
                        </Alert>
                    </Grid.Column>
                )}
                <Grid.Column span={6}>
                    <Bind name="name" validators={validation.create("required,minLength:1")}>
                        <Input
                            required
                            label={t`Name`}
                            disabled={!canModifyRole}
                            onBlur={generateSlug}
                            data-testid="admin.am.role.new.name"
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Bind name="slug" validators={validation.create("required,minLength:1")}>
                        <Input
                            required
                            disabled={!canModifyRole || !newEntry}
                            label={t`Slug`}
                            data-testid="admin.am.role.new.slug"
                        />
                    </Bind>
                </Grid.Column>
                <Grid.Column span={12}>
                    <Bind
                        name="description"
                        validators={validation.create("maxLength:500")}
                        defaultValue={""}
                    >
                        <Textarea
                            label={t`Description`}
                            rows={3}
                            disabled={!canModifyRole}
                            data-testid="admin.am.role.new.description"
                        />
                    </Bind>
                </Grid.Column>
            </>
        </Grid>
    );
};
