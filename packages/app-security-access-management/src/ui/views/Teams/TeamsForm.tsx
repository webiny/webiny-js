import React, { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import styled from "@emotion/styled";
import pick from "lodash/pick";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_TEAM, LIST_TEAMS, READ_TEAM, UPDATE_TEAM } from "./graphql";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { GroupsMultiAutocomplete } from "~/components/GroupsMultiAutocomplete";
import { Team } from "~/types";
import { Alert } from "@webiny/ui/Alert";

const t = i18n.ns("app-security/admin/teams/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

export interface TeamsFormProps {
    // TODO @ts-refactor delete and go up the tree and sort it out
    [key: string]: any;
}

export const TeamsForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newTeam = new URLSearchParams(location.search).get("new") === "true";
    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(READ_TEAM, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.team;
            if (error) {
                history.push("/access-management/teams");
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
                              data: pick(formData, ["name", "description", "groups"])
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: pick(formData, ["name", "slug", "description", "groups"])
                          }
                      }
                  ];

            const response = await operation(args);

            const { data: team, error } = response.data.security.team;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/access-management/teams?id=${team.id}`);
            showSnackbar(t`Team saved successfully!`);
        },
        [id]
    );

    const data = loading ? {} : get(getQuery, "data.security.team.data", {});

    const systemTeam = data.system;
    const pluginTeam = data.plugin;
    const canModifyTeam = !systemTeam && !pluginTeam;

    const showEmptyView = !newTeam && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display team details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-record-button"
                        onClick={() => history.push("/access-management/teams?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} />
                        {t`New Team`}
                    </ButtonDefault>
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => {
                return (
                    <SimpleForm>
                        {loading && <CircularProgress />}
                        <SimpleFormHeader title={data.name ? data.name : "Untitled"} />
                        <SimpleFormContent>
                            {systemTeam && (
                                <Grid>
                                    <Cell span={12}>
                                        <Alert type={"info"} title={"Permissions are locked"}>
                                            This is a protected system team and you can&apos;t
                                            modify its permissions.
                                        </Alert>
                                    </Cell>
                                </Grid>
                            )}
                            {pluginTeam && (
                                <Grid>
                                    <Cell span={12}>
                                        <Alert type={"info"} title={"Important"}>
                                            This team is registered via an extension, and cannot be
                                            modified.
                                        </Alert>
                                    </Cell>
                                </Grid>
                            )}
                            <Grid>
                                <Cell span={6}>
                                    <Bind
                                        name="name"
                                        validators={validation.create("required,minLength:3")}
                                    >
                                        <Input
                                            disabled={!canModifyTeam}
                                            label={t`Name`}
                                            data-testid="admin.am.team.new.name"
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind
                                        name="slug"
                                        validators={validation.create("required,minLength:3")}
                                    >
                                        <Input
                                            disabled={!canModifyTeam || !newTeam}
                                            label={t`Slug`}
                                            data-testid="admin.am.team.new.slug"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="description"
                                        validators={validation.create("maxLength:500")}
                                    >
                                        <Input
                                            disabled={!canModifyTeam}
                                            label={t`Description`}
                                            rows={3}
                                            data-testid="admin.am.team.new.description"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name="groups" validators={validation.create("required")}>
                                        <GroupsMultiAutocomplete
                                            disabled={!canModifyTeam}
                                            label={t`Roles`}
                                            data-testid="admin.am.team.new.groups"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        {canModifyTeam && (
                            <SimpleFormFooter>
                                <ButtonWrapper>
                                    <ButtonDefault
                                        onClick={() => history.push("/access-management/teams")}
                                    >{t`Cancel`}</ButtonDefault>
                                    <ButtonPrimary
                                        data-testid="admin.am.team.new.save"
                                        onClick={ev => {
                                            form.submit(ev);
                                        }}
                                    >{t`Save team`}</ButtonPrimary>
                                </ButtonWrapper>
                            </SimpleFormFooter>
                        )}
                    </SimpleForm>
                );
            }}
        </Form>
    );
};
