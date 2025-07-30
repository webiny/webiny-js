import React, { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Permissions } from "@webiny/app-admin/components/Permissions";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_GROUP, LIST_GROUPS, READ_GROUP, UPDATE_GROUP } from "./graphql";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { Group } from "~/types";
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

const t = i18n.ns("app-security/admin/roles/form");

export interface GroupsFormProps {
    // TODO @ts-refactor delete and go up the tree and sort it out
    [key: string]: any;
}

export const GroupsForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newGroup = new URLSearchParams(location.search).get("new") === "true";
    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(READ_GROUP, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.group;
            if (error) {
                history.push("/access-management/roles");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_GROUP, {
        refetchQueries: [{ query: LIST_GROUPS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_GROUP, {
        refetchQueries: [{ query: LIST_GROUPS }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async ({ id, name, description, slug, permissions, createdOn }: Group) => {
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

            !isUpdate && history.push(`/access-management/roles?id=${group.id}`);
            showSnackbar(t`Role saved successfully!`);
        },
        [id]
    );

    const data: Group = loading ? {} : get(getQuery, "data.security.group.data", {});

    const systemGroup = data.slug === "full-access" || data.system;
    const pluginGroup = data.plugin;
    const canModifyGroup = !systemGroup && !pluginGroup;

    const showEmptyView = !newGroup && !loading && isEmpty(data);
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
                        onClick={() => history.push("/access-management/roles?new=true")}
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
                                    {systemGroup && (
                                        <Grid.Column span={12}>
                                            <Alert
                                                type={"warning"}
                                                title={"Permissions are locked"}
                                            >
                                                This is a protected system role and you can&apos;t
                                                modify its permissions.
                                            </Alert>
                                        </Grid.Column>
                                    )}
                                    {pluginGroup && (
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
                                                disabled={!canModifyGroup}
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
                                                disabled={!canModifyGroup || !newGroup}
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
                                                disabled={!canModifyGroup}
                                                data-testid="admin.am.group.new.description"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                </>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormHeader title={"Permissions"} rounded={false}>
                            <div className={"wby-flex wby-justify-end"}>
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
                            <Grid>
                                <>
                                    {canModifyGroup && (
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
                            {canModifyGroup && (
                                <>
                                    <Button
                                        variant={"secondary"}
                                        text={t`Cancel`}
                                        onClick={() => history.push("/access-management/roles")}
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
