import React, { useCallback } from "react";
import isEmpty from "lodash/isEmpty.js";
import get from "lodash/get.js";
import { Bind, type FormRenderPropParams, useForm, useGenerateSlug } from "@webiny/form";
import { ReactComponent as DevicesIcon } from "@webiny/icons/devices_other.svg";
import { Form } from "@webiny/form";
import { i18n } from "@webiny/app/i18n/index.js";
import { validation } from "@webiny/validation";

import {
    useRoute,
    useRouter,
    useSnackbar,
    EmptyView,
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin";
import { IconPicker } from "~/admin/components/IconPicker.js";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { useMutation, useQuery } from "../../hooks/index.js";
import * as GQL from "./graphql.js";
import { usePermission } from "~/admin/hooks/index.js";
import { Tooltip } from "@webiny/admin-ui";
import type {
    CmsGroup,
    CreateCmsGroupMutationResponse,
    CreateCmsGroupMutationVariables,
    GetCmsGroupQueryResponse,
    GetCmsGroupQueryVariables,
    ListCmsGroupsQueryResponse,
    UpdateCmsGroupMutationResponse,
    UpdateCmsGroupMutationVariables
} from "./graphql.js";
import { Button, Grid, Input, OverlayLoader, Textarea } from "@webiny/admin-ui";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");

interface ContentModelGroupsFormProps {
    canCreate: boolean;
}
const ContentModelGroupsForm = ({ canCreate }: ContentModelGroupsFormProps) => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentModelGroups.List);
    const { showSnackbar } = useSnackbar();
    const { canEdit } = usePermission();

    const newEntry = route.params.new === true;
    const id = route.params.id;

    const getQuery = useQuery<GetCmsGroupQueryResponse, GetCmsGroupQueryVariables>(
        GQL.GET_CONTENT_MODEL_GROUP,
        {
            variables: {
                id: id as string
            },
            skip: !id,
            onCompleted: data => {
                if (!data) {
                    return;
                }

                const { error } = data.contentModelGroup;
                if (error) {
                    goToRoute(Routes.ContentModelGroups.List);
                    showSnackbar(error.message);
                }
            }
        }
    );

    // Create a new group and update list cache
    const [create, createMutation] = useMutation<
        CreateCmsGroupMutationResponse,
        CreateCmsGroupMutationVariables
    >(GQL.CREATE_CONTENT_MODEL_GROUP, {
        update(cache, { data }) {
            if (!data || data.contentModelGroup.error) {
                return;
            }

            const gqlParams = {
                query: GQL.LIST_CONTENT_MODEL_GROUPS
            };
            const result = cache.readQuery<ListCmsGroupsQueryResponse>(gqlParams);
            if (!result || !result.listContentModelGroups) {
                return;
            }
            const { listContentModelGroups } = result;
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
    const [update, updateMutation] = useMutation<
        UpdateCmsGroupMutationResponse,
        UpdateCmsGroupMutationVariables
    >(GQL.UPDATE_CONTENT_MODEL_GROUP);

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const createOperation = useCallback(
        (group: Partial<CmsGroup>) => {
            if (!group.id) {
                return create({
                    refetchQueries: ["CmsListMenuContentGroupsModels"],
                    variables: {
                        data: {
                            name: group.name,
                            slug: group.slug,
                            description: group.description,
                            icon: group.icon
                        }
                    }
                });
            }
            return update({
                refetchQueries: ["CmsListMenuContentGroupsModels"],
                variables: {
                    id: group.id,
                    data: {
                        name: group.name,
                        description: group.description,
                        icon: group.icon
                    }
                }
            });
        },
        [create, update]
    );

    const onSubmit = useCallback(
        async (group: Partial<CmsGroup>): Promise<void> => {
            /**
             * Create or update, depends if group object has id property
             */
            const response = await createOperation(group);
            if (!response.data) {
                showSnackbar(`Missing response data ain Content Model Group Mutation Response.`);
                return;
            }

            const { data, error } = response.data.contentModelGroup;
            if (error) {
                showSnackbar(error.message);
                return;
            }
            /**
             * Redirect to a new group
             */
            if (!group.id) {
                goToRoute(Routes.ContentModelGroups.List, { id: data.id });
            }
            showSnackbar(t`Content model group saved successfully!`);
        },
        [id]
    );

    const data: CmsGroup | null = getQuery.loading
        ? null
        : get(getQuery, "data.contentModelGroup.data", null);

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                icon={<DevicesIcon />}
                title={t`Click on the left side list to display group details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <Button
                            text={t`New Group`}
                            icon={<AddIcon />}
                            data-testid="new-record-button"
                            onClick={() => {
                                goToRoute(Routes.ContentModelGroups.List, { new: true });
                            }}
                        />
                    ) : (
                        <></>
                    )
                }
            />
        );
    }

    return (
        <Form onSubmit={onSubmit} data={data || { icon: "fas/star" }}>
            {({ data, form }: FormRenderPropParams<CmsGroup>) => (
                <SimpleForm data-testid={"pb-content-model-groups-form"}>
                    <SimpleFormHeader title={data.name ? data.name : t`New content model group`} />
                    {loading && <OverlayLoader />}
                    <SimpleFormContent>
                        <FormContent newEntry={newEntry} />
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <Button
                            variant={"secondary"}
                            text={t`Cancel`}
                            onClick={() => {
                                goToRoute(Routes.ContentModelGroups.List);
                            }}
                        />

                        {canEdit(data, "cms.contentModelGroup") && (
                            <React.Fragment>
                                {!data.plugin ? (
                                    <Button
                                        variant={"primary"}
                                        text={t`Save`}
                                        onClick={form.submit}
                                        data-testid={"cms.form.group.submit"}
                                    />
                                ) : (
                                    <Tooltip
                                        content={"Content model group is registered via a plugin."}
                                        side={"bottom"}
                                        trigger={
                                            <Button
                                                disabled
                                                variant={"primary"}
                                                text={t`Save`}
                                                data-testid={"cms.form.group.submit"}
                                            />
                                        }
                                    />
                                )}
                            </React.Fragment>
                        )}
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

interface FormContentProps {
    newEntry: boolean;
}

const FormContent = ({ newEntry }: FormContentProps) => {
    const form = useForm();
    const { generateSlug } = useGenerateSlug(form, "name", "slug");

    return (
        <Grid>
            <Grid.Column span={12}>
                <Bind name="name" validators={validation.create("required,maxLength:100")}>
                    <Input
                        data-testid={"cms.form.group.name"}
                        label={t`Name`}
                        onBlur={generateSlug}
                        required
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name={"slug"} validators={[validation.create("required,slug")]}>
                    <Input label={"Slug"} required disabled={!newEntry} />
                </Bind>
            </Grid.Column>

            <Grid.Column span={12}>
                <Bind name="icon" validators={validation.create("required")}>
                    <IconPicker
                        label={t`Group icon`}
                        description={t`Icon that will be displayed in the main menu.`}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={12}>
                <Bind name="description" defaultValue={""}>
                    <Textarea
                        data-testid={"cms.form.group.description"}
                        rows={5}
                        label={t`Description`}
                    />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

export default ContentModelGroupsForm;
