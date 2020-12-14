import React, { useCallback } from "react";
import { useRouter } from "@webiny/react-router";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
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
import { CREATE_GROUP, LIST_GROUPS, READ_GROUP, UPDATE_GROUP } from "./graphql";

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
                                        validators={validation.create("maxlength:500")}
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
                            <ButtonPrimary onClick={form.submit}>{t`Save group`}</ButtonPrimary>
                        </SimpleFormFooter>
                    </SimpleForm>
                );
            }}
        </Form>
    );
};

export default GroupForm;
