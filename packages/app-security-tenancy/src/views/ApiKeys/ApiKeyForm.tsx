import React, { useCallback } from "react";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary, CopyButton } from "@webiny/ui/Button";
import { Accordion } from "@webiny/ui/Accordion";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { Typography } from "@webiny/ui/Typography";
import { plugins } from "@webiny/plugins";
import { AdminAppPermissionRendererPlugin } from "@webiny/app-admin/types";
import { pickDataForAPI } from "./utils";
import { useMutation, useQuery } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import * as GQL from "./graphql";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";

const t = i18n.ns("app-security-tenancy/admin/api-keys/form");

const ApiKeyForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

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
                history.push("/security/api-keys");
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

            !isUpdate && history.push(`/security/api-keys?id=${id}`);
            showSnackbar(t`API key saved successfully.`);
        },
        [id]
    );

    const data = get(getQuery, "data.security.apiKey.data", {});

    const permissionPlugins = plugins.byType<AdminAppPermissionRendererPlugin>(
        "admin-app-permissions-renderer"
    );

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
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="description"
                                        validators={validation.create("required")}
                                    >
                                        <Input label={t`Description`} rows={4} />
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
                                    <Bind name={"permissions"}>
                                        {props => (
                                            <Accordion elevation={0}>
                                                {permissionPlugins.map(pl => (
                                                    <React.Fragment key={pl.name + data.slug}>
                                                        {pl.render({
                                                            parent: { id: data.id || "new" },
                                                            value: props.value,
                                                            onChange: props.onChange
                                                        })}
                                                    </React.Fragment>
                                                ))}
                                            </Accordion>
                                        )}
                                    </Bind>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary onClick={form.submit}>{t`Save API key`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

export default ApiKeyForm;
