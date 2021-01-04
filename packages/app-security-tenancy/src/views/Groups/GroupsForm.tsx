import React, { useCallback } from "react";
import { useMutation, useQuery } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
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
import { pickDataForAPI } from "./utils";
import { CREATE_GROUP, LIST_GROUPS, READ_GROUP, UPDATE_GROUP } from "./graphql";
import { SnackbarAction } from "@webiny/ui/Snackbar";

const t = i18n.ns("app-security/admin/groups/form");

const GroupForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery(READ_GROUP, {
        variables: { slug },
        skip: !slug,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.security.group;
            if (error) {
                history.push("/security/groups");
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
                ? [update, { variables: { slug: data.slug, data: pickDataForAPI(data) } }]
                : [create, { variables: { data: pickDataForAPI(data) } }];

            const response = await operation(args);

            const error = response?.data?.security?.group?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            const slug = response?.data?.security?.group?.data?.slug;

            !isUpdate && history.push(`/security/groups?slug=${slug}`);
            showSnackbar(t`Group saved successfully.`);
        },
        [slug]
    );

    const data = getQuery?.data?.security?.group.data || {};

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
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind
                                        name="slug"
                                        validators={validation.create("required,minLength:3")}
                                    >
                                        <Input disabled={data.id} label={t`Slug`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name="description"
                                        validators={validation.create("maxLength:500")}
                                    >
                                        <Input label={t`Description`} rows={3} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={12}>
                                    <Typography use={"subtitle1"}>{t`Permissions`}</Typography>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"permissions"} defaultValue={[]}>
                                        {bind => <Permissions id={data.slug || "new"} {...bind} />}
                                    </Bind>
                                </Cell>
                            </Grid>
                        </SimpleFormContent>
                        <SimpleFormFooter>
                            <ButtonPrimary onClick={form.submit}>{t`Save group`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

export default GroupForm;
