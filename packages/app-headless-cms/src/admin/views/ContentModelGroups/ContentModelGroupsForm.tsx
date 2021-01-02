import React, { useCallback } from "react";
import get from "lodash/get";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import IconPicker from "./IconPicker";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "@webiny/app-headless-cms/admin/hooks";
import * as GQL from "./graphql";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");

function ContentModelGroupsForm() {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const id = new URLSearchParams(location.search).get("id");

    const getQuery = useQuery(GQL.GET_CONTENT_MODEL_GROUP, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            if (!data) {
                return;
            }

            const { error } = data.contentModelGroup;
            if (error) {
                history.push("/cms/content-model-group");
                showSnackbar(error.message);
            }
        }
    });

    // Create a new group and update list cache
    const [create, createMutation] = useMutation(GQL.CREATE_CONTENT_MODEL_GROUP, {
        update(cache, { data }) {
            if (data.contentModelGroup.error) {
                return;
            }

            const gqlParams = { query: GQL.LIST_CONTENT_MODEL_GROUPS };
            const { listContentModelGroups } = cache.readQuery(gqlParams);
            cache.writeQuery({
                ...gqlParams,
                data: {
                    listContentModelGroups: {
                        ...listContentModelGroups,
                        data: [data.contentModelGroup.data, ...listContentModelGroups.data]
                    }
                }
            });
        }
    });
    const [update, updateMutation] = useMutation(GQL.UPDATE_CONTENT_MODEL_GROUP);

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async ({ id, ...group }) => {
            const [operation, args] = id
                ? [update, { variables: { id, data: group } }]
                : [create, { variables: { data: group } }];

            const response = await operation(args);

            const { data, error } = response.data.contentModelGroup;
            if (error) {
                return showSnackbar(error.message);
            }

            !id && history.push(`/cms/content-model-groups?id=${data.id}`);
            showSnackbar(t`Content model group saved successfully!`);
        },
        [id]
    );

    const data = getQuery.loading ? null : get(getQuery, "data.contentModelGroup.data", null);

    return (
        <Form onSubmit={onSubmit} data={data || { icon: "fas/star" }}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={"pb-content-model-groups-form"}>
                    <SimpleFormHeader title={data.name ? data.name : t`New content model group`} />
                    {loading && <CircularProgress />}
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind
                                    name="name"
                                    validators={validation.create("required,maxLength:100")}
                                >
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind name="icon" validators={validation.create("required")}>
                                    <IconPicker
                                        label={t`Group icon`}
                                        description={t`Icon that will be displayed in the main menu.`}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="description">
                                    <Input rows={5} label={t`Description`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary
                            onClick={form.submit}
                        >{t`Save content model group`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
}

export default ContentModelGroupsForm;
