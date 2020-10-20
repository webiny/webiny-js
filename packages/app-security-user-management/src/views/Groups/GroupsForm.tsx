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
import { createPermissionsMap, formatDataForAPI } from "./utils";
import { useMutation, useQuery } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import get from "lodash/get";
import { CREATE_GROUP, LIST_GROUPS, READ_GROUP, UPDATE_GROUP } from "./graphql";

const t = i18n.ns("app-security/admin/groups/form");

const GroupForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(READ_GROUP, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = data?.security?.group?.error;
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
                ? [update, { variables: { id: data.id, ...formatDataForAPI(data) } }]
                : [create, { variables: { ...formatDataForAPI(data) } }];

            const response = await operation(args);

            const error = response?.data?.security?.group?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            const id = response?.data?.security?.group?.data?.id;

            !isUpdate && history.push(`/security/groups?id=${id}`);
            showSnackbar(t`Group saved successfully.`);
        },
        [id]
    );

    let data = getQuery?.data?.security?.group.data || {};

    const permissionPlugins = plugins.byType<AdminAppPermissionRendererPlugin>(
        "admin-app-permissions-renderer"
    );
    // From API to UI
    if (Array.isArray(data.permissions)) {
        data = {
            ...data,
            permissions: createPermissionsMap(data.permissions)
        };
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
                                    <Bind name="name" validators={validation.create("required")}>
                                        <Input label={t`Name`} />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name="slug" validators={validation.create("required")}>
                                        <Input disabled={data.id} label={t`Slug`} />
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
                                    <Typography use={"subtitle1"}>{t`Permissions`}</Typography>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"permissions"}>
                                        {props => (
                                            <Accordion elevation={0}>
                                                {permissionPlugins.map(pl =>
                                                    pl.render({
                                                        id: get(
                                                            props,
                                                            "form.state.data.id",
                                                            pl.name
                                                        ),
                                                        value: props.value,
                                                        onChange: props.onChange
                                                    })
                                                )}
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
