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
import { Alert } from "@webiny/ui/Alert";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { Permissions } from "@webiny/app-admin/components/Permissions";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CREATE_GROUP, LIST_GROUPS, READ_GROUP, UPDATE_GROUP } from "./graphql";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const t = i18n.ns("app-security/admin/groups/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

export interface GroupsFormProps {
    // TODO @ts-refactor delete and go up the tree and sort it out
    [key: string]: any;
}
export const GroupsForm: React.FC<GroupsFormProps> = () => {
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
                history.push("/access-management/groups");
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
        async data => {
            if (!data.permissions || !data.permissions.length) {
                showSnackbar(t`You must configure permissions before saving!`, {
                    timeout: 60000,
                    dismissesOnAction: true,
                    action: <SnackbarAction label={"OK"} />
                });
                return;
            }

            const isUpdate = data.createdOn;
            const [operation, args] = isUpdate
                ? [
                      update,
                      {
                          variables: {
                              id: data.id,
                              data: pick(data, ["name", "description", "permissions"])
                          }
                      }
                  ]
                : [
                      create,
                      {
                          variables: {
                              data: pick(data, ["name", "slug", "description", "permissions"])
                          }
                      }
                  ];

            const response = await operation(args);

            const { data: group, error } = response.data.security.group;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/access-management/groups?id=${group.id}`);
            showSnackbar(t`Group saved successfully!`);
        },
        [id]
    );

    const data = loading ? {} : get(getQuery, "data.security.group.data", {});

    const systemGroup = data.slug === "full-access";

    const showEmptyView = !newGroup && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display group details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-record-button"
                        onClick={() => history.push("/access-management/groups?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} />
                        {t`New Group`}
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
                            <Grid>
                                <Cell span={6}>
                                    <Bind
                                        name="name"
                                        validators={validation.create("required,minLength:3")}
                                    >
                                        <Input
                                            label={t`Name`}
                                            disabled={systemGroup}
                                            data-testid="admin.am.group.new.name"
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind
                                        name="slug"
                                        validators={validation.create("required,minLength:3")}
                                    >
                                        <Input
                                            disabled={Boolean(data.id)}
                                            label={t`Slug`}
                                            data-testid="admin.am.group.new.slug"
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
                                            label={t`Description`}
                                            rows={3}
                                            disabled={systemGroup}
                                            data-testid="admin.am.group.new.description"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                            {systemGroup && (
                                <Grid>
                                    <Cell span={12}>
                                        <Alert type={"info"} title={"Permissions are locked"}>
                                            This is a protected system group and you can&apos;t
                                            modify its permissions.
                                        </Alert>
                                    </Cell>
                                </Grid>
                            )}
                            {!systemGroup && (
                                <Grid>
                                    <Cell span={12}>
                                        <Typography use={"subtitle1"}>{t`Permissions`}</Typography>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name={"permissions"} defaultValue={[]}>
                                            {bind => (
                                                <Permissions id={data.id || "new"} {...bind} />
                                            )}
                                        </Bind>
                                    </Cell>
                                </Grid>
                            )}
                        </SimpleFormContent>
                        {systemGroup ? null : (
                            <SimpleFormFooter>
                                <ButtonWrapper>
                                    <ButtonDefault
                                        onClick={() => history.push("/access-management/groups")}
                                    >{t`Cancel`}</ButtonDefault>
                                    <ButtonPrimary
                                        data-testid="admin.am.group.new.save"
                                        onClick={ev => {
                                            form.submit(ev);
                                        }}
                                    >{t`Save group`}</ButtonPrimary>
                                </ButtonWrapper>
                            </SimpleFormFooter>
                        )}
                    </SimpleForm>
                );
            }}
        </Form>
    );
};
