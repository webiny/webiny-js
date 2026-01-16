import React, { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import pick from "lodash/pick.js";
import get from "lodash/get.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Bind, Form, useForm, useGenerateSlug } from "@webiny/form";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader,
    EmptyView,
    useSnackbar,
    useRouter
} from "@webiny/app-admin";
import { CREATE_TEAM, LIST_TEAMS, READ_TEAM, UPDATE_TEAM } from "./graphql.js";
import isEmpty from "lodash/isEmpty.js";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import type { Team } from "~/types.js";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { Alert, Button, Grid, Input, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { RolesMultiAutocomplete } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-security/admin/teams/form");

export interface TeamsFormProps {
    newEntry: boolean;
    id: string | undefined;
}

export const TeamsForm = ({ newEntry, id }: TeamsFormProps) => {
    const { goToRoute } = useRouter();
    const { showSnackbar } = useSnackbar();

    const getQuery = useQuery(READ_TEAM, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.team;
            if (error) {
                goToRoute(Routes.Teams.List);
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(CREATE_TEAM, {
        refetchQueries: [{ query: LIST_TEAMS }]
    });

    const [update, updateMutation] = useMutation(UPDATE_TEAM, {
        refetchQueries: [{ query: LIST_TEAMS }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async (formData: Team) => {
            const isUpdate = formData.createdOn;
            const [operation, args] = isUpdate
                ? [
                      update,
                      {
                          variables: {
                              id: formData.id,
                              data: pick(formData, ["name", "description", "roles"])
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: pick(formData, ["name", "slug", "description", "roles"])
                          }
                      }
                  ];

            const response = await operation(args);

            const { data: team, error } = response.data.security.team;
            if (error) {
                return showSnackbar(error.message);
            }

            if (!isUpdate) {
                goToRoute(Routes.Teams.List, { id: team.id });
            }
            showSnackbar(t`Team saved successfully!`);
        },
        [id]
    );

    const data = loading ? {} : get(getQuery, "data.security.team.data", {});

    const systemTeam = data.system;
    const pluginTeam = data.plugin ?? false;
    const canModifyTeam = !systemTeam && !pluginTeam;

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                icon={<SettingsIcon />}
                title={t`Click on the left side list to display team details or create a...`}
                action={
                    <Button
                        text={t`New Team`}
                        icon={<AddIcon />}
                        data-testid="new-record-button"
                        onClick={() => {
                            goToRoute(Routes.Teams.List, { new: true });
                        }}
                    />
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form }) => {
                return (
                    <SimpleForm>
                        {loading && <OverlayLoader />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            <FormContent
                                pluginTeam={pluginTeam}
                                systemTeam={systemTeam}
                                canModifyTeam={canModifyTeam}
                                newEntry={newEntry}
                            />
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <Button
                                variant={"secondary"}
                                text={t`Cancel`}
                                onClick={() => {
                                    goToRoute(Routes.Teams.List);
                                }}
                            />
                            {canModifyTeam && (
                                <Button
                                    text={t`Save`}
                                    data-testid="admin.am.team.new.save"
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                />
                            )}
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

interface FormContentProps {
    systemTeam: boolean;
    pluginTeam: boolean;
    canModifyTeam: boolean;
    newEntry: boolean;
}

const FormContent = (props: FormContentProps) => {
    const { newEntry, pluginTeam, systemTeam, canModifyTeam } = props;

    const form = useForm();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");

    return (
        <Grid>
            <>
                {systemTeam && (
                    <Grid.Column span={12}>
                        <Alert type={"info"} title={"Permissions are locked"}>
                            This is a protected system team and you can&apos;t modify its
                            permissions.
                        </Alert>
                    </Grid.Column>
                )}
                {pluginTeam && (
                    <Grid.Column span={12}>
                        <Alert type={"info"} title={"Important"}>
                            This team is registered via an extension, and cannot be modified.
                        </Alert>
                    </Grid.Column>
                )}
            </>
            <Grid.Column span={6}>
                <Bind name="name" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        onBlur={generateSlug}
                        disabled={!canModifyTeam}
                        label={t`Name`}
                        data-testid="admin.am.team.new.name"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={6}>
                <Bind name="slug" validators={validation.create("required,minLength:1")}>
                    <Input
                        required
                        disabled={!canModifyTeam || !newEntry}
                        label={t`Slug`}
                        data-testid="admin.am.team.new.slug"
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
                        disabled={!canModifyTeam}
                        label={t`Description`}
                        rows={3}
                        data-testid="admin.am.team.new.description"
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name="roles" validators={validation.create("required")}>
                    <RolesMultiAutocomplete
                        disabled={!canModifyTeam}
                        label={t`Roles`}
                        data-testid="admin.am.team.new.roles"
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};
