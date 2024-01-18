import React, { useCallback } from "react";
import styled from "@emotion/styled";
import isEmpty from "lodash/isEmpty";
import get from "lodash/get";
import { Form, FormRenderPropParams } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { validation } from "@webiny/validation";

import {
    SimpleFormHeader,
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent
} from "@webiny/app-admin/components/SimpleForm";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { useMutation, useQuery } from "../../hooks";
import * as GQL from "./graphql";
import usePermission from "../../hooks/usePermission";
import { Tooltip } from "@webiny/ui/Tooltip";
import {
    CmsGroup,
    CreateCmsGroupMutationResponse,
    CreateCmsGroupMutationVariables,
    GetCmsGroupQueryResponse,
    GetCmsGroupQueryVariables,
    ListCmsGroupsQueryResponse,
    UpdateCmsGroupMutationResponse,
    UpdateCmsGroupMutationVariables
} from "./graphql";

const t = i18n.ns("app-headless-cms/admin/content-model-groups/form");
const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

interface ContentModelGroupsFormProps {
    canCreate: boolean;
}
const ContentModelGroupsForm = ({ canCreate }: ContentModelGroupsFormProps) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const { canEdit } = usePermission();

    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const id = new URLSearchParams(location.search).get("id");

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
                    history.push("/cms/content-model-group");
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
                    variables: {
                        data: {
                            name: group.name,
                            description: group.description,
                            icon: group.icon
                        }
                    }
                });
            }
            return update({
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
                history.push(`/cms/content-model-groups?id=${data.id}`);
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
                title={t`Click on the left side list to display group details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <ButtonDefault
                            data-testid="new-record-button"
                            onClick={() => history.push("/cms/content-model-groups?new=true")}
                        >
                            <ButtonIcon icon={<AddIcon />} /> {t`New Group`}
                        </ButtonDefault>
                    ) : (
                        <></>
                    )
                }
            />
        );
    }

    return (
        <Form onSubmit={onSubmit} data={data || {}}>
            {({ data, form, Bind }: FormRenderPropParams<CmsGroup>) => (
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
                                    <Input data-testid={"cms.form.group.name"} label={t`Name`} />
                                </Bind>
                            </Cell>

                            <Cell span={12}>
                                <Bind
                                    name="icon"
                                    validators={validation.create("required")}
                                    defaultValue={{
                                        type: "icon",
                                        name: "regular_star",
                                        value: '<path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3l153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4L459.8 484c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6l68.6-141.3C270.4 5.2 278.7 0 287.9 0zm0 79l-52.5 108.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9l85.9 85.1c5.5 5.5 8.1 13.3 6.8 21l-20.3 119.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2l-20.2-119.6c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1l-118.3-17.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/>',
                                        width: 576
                                    }}
                                >
                                    <IconPicker
                                        label={t`Group icon`}
                                        description={t`Icon that will be displayed in the main menu.`}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="description">
                                    <Input
                                        data-testid={"cms.form.group.description"}
                                        rows={5}
                                        label={t`Description`}
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonWrapper>
                            <ButtonDefault
                                onClick={() => history.push("/cms/content-model-groups")}
                            >{t`Cancel`}</ButtonDefault>

                            {canEdit(data, "cms.contentModelGroup") && (
                                <React.Fragment>
                                    {!data.plugin ? (
                                        <ButtonPrimary
                                            onClick={ev => {
                                                form.submit(ev);
                                            }}
                                            data-testid={"cms.form.group.submit"}
                                        >{t`Save content model group`}</ButtonPrimary>
                                    ) : (
                                        <Tooltip
                                            content={
                                                "Content model group is registered via a plugin."
                                            }
                                            placement={"bottom"}
                                        >
                                            <ButtonPrimary
                                                disabled
                                            >{t`Save content model group`}</ButtonPrimary>
                                        </Tooltip>
                                    )}
                                </React.Fragment>
                            )}
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default ContentModelGroupsForm;
