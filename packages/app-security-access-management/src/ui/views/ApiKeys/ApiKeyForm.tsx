import React, { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonIcon, ButtonPrimary, CopyButton } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { Permissions } from "@webiny/app-admin/components/Permissions";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { pickDataForAPI } from "./utils";
import * as GQL from "./graphql";
import { SnackbarAction } from "@webiny/ui/Snackbar";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import styled from "@emotion/styled";
import { ApiKey } from "~/types";

const t = i18n.ns("app-security-admin-users/admin/api-keys/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});
export interface ApiKeyFormProps {
    // TODO @ts-refactor delete and go up the tree and sort it out
    [key: string]: any;
}
export const ApiKeyForm: React.FC<ApiKeyFormProps> = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(GQL.READ_API_KEY, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.apiKey;
            if (error) {
                history.push("/access-management/api-keys");
                showSnackbar(error.message);
            }
        }
    });

    const [create, createMutation] = useMutation(GQL.CREATE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
    });

    const [update, updateMutation] = useMutation(GQL.UPDATE_API_KEY, {
        refetchQueries: [{ query: GQL.LIST_API_KEYS }]
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
                ? [update, { variables: { id: data.id, data: pickDataForAPI(data) } }]
                : [create, { variables: { data: pickDataForAPI(data) } }];

            const response = await operation(args);

            const { error } = response.data.security.apiKey;
            if (error) {
                return showSnackbar(error.message);
            }

            const { id } = response.data.security.apiKey.data;

            !isUpdate && history.push(`/access-management/api-keys?id=${id}`);
            showSnackbar(t`API key saved successfully.`);
        },
        [id]
    );

    const data: ApiKey[] = get(getQuery, "data.security.apiKey.data", {});

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display API key details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-record-button"
                        onClick={() => history.push("/access-management/api-keys?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New API Key`}
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
                                <Cell span={12}>
                                    <Bind name="name" validators={validation.create("required")}>
                                        <Input
                                            label={t`Name`}
                                            data-testid="sam.key.new.form.name"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="description"
                                        validators={validation.create("required")}
                                    >
                                        <Input
                                            label={t`Description`}
                                            rows={4}
                                            data-testid="sam.key.new.form.description"
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <div>
                                        <Typography use={"subtitle1"}>{t`Token`}</Typography>
                                        {data.token ? (
                                            <div
                                                style={{
                                                    background: "var(--mdc-theme-background)",
                                                    padding: "8px",
                                                    paddingLeft: "16px"
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        lineHeight: "48px",
                                                        verticalAlign: "middle"
                                                    }}
                                                >
                                                    {data.token}
                                                </span>
                                                <span
                                                    style={{ position: "absolute", right: "32px" }}
                                                >
                                                    <CopyButton
                                                        value={data.token}
                                                        onCopy={() =>
                                                            showSnackbar("Successfully copied!")
                                                        }
                                                    />
                                                </span>
                                            </div>
                                        ) : (
                                            <FormElementMessage>
                                                Your token will be shown once you submit the form.
                                            </FormElementMessage>
                                        )}
                                    </div>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Typography use={"subtitle1"}>{t`Permissions`}</Typography>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"permissions"} defaultValue={[]}>
                                        {bind => <Permissions id={data.id || "new"} {...bind} />}
                                    </Bind>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonWrapper>
                                <ButtonDefault
                                    onClick={() => history.push("/access-management/api-keys")}
                                    data-testid="sam.key.new.form.button.cancel"
                                >{t`Cancel`}</ButtonDefault>
                                <ButtonPrimary
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                    data-testid="sam.key.new.form.button.save"
                                >{t`Save API key`}</ButtonPrimary>
                            </ButtonWrapper>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};
