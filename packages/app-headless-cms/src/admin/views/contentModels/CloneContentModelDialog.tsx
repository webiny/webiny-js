import React, { useCallback, useEffect, useState } from "react";

import { useRouter } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Input, Button, Textarea, Grid, Select, OverlayLoader } from "@webiny/admin-ui";

import { useToast } from "@webiny/admin-ui";

import { validation } from "@webiny/validation";
import { useApolloClient, useMutation, useQuery } from "../../hooks/index.js";
import { i18n } from "@webiny/app/i18n/index.js";

import { addModelToGroupCache, addModelToListCache } from "./cache.js";
import type { CmsModel } from "~/types.js";
import type {
    CreateCmsModelFromMutationResponse,
    CreateCmsModelFromMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql.js";
import { CREATE_CONTENT_MODEL_FROM, LIST_MENU_CONTENT_GROUPS_MODELS } from "../../viewsGraphql.js";
import type { CmsGroupOption } from "~/admin/views/contentModels/types.js";
import { Dialog } from "~/admin/components/Dialog.js";
import { createNameValidator } from "~/admin/views/contentModels/helpers/nameValidator.js";
import { createApiNameValidator } from "~/admin/views/contentModels/helpers/apiNameValidator.js";
import { IconPicker } from "~/admin/components/IconPicker.js";
import { Routes } from "~/routes.js";

const t = i18n.ns("app-headless-cms/admin/views/content-models/clone-content-model-dialog");

const getSelectedGroup = (groups: CmsGroupOption[] | null, model: CmsModel): string | null => {
    if (!groups || groups.length === 0 || !model) {
        return "";
    }
    const current = model.group;
    const group = groups.find(g => g.value === current);
    if (group) {
        return group.value;
    }
    const defaultSelected = groups.find(() => true);
    return defaultSelected ? defaultSelected.value : null;
};

interface CloneContentModelDialogProps {
    onClose: () => void;
    contentModel: CmsModel;
    closeModal: () => void;
}

export const CloneContentModelDialog = ({
    onClose,
    contentModel,
    closeModal
}: CloneContentModelDialogProps) => {
    const [loading, setLoading] = useState<boolean>(false);
    const { showWarningToast } = useToast();
    const { goToRoute } = useRouter();
    const client = useApolloClient();

    const [groups, setGroups] = useState<CmsGroupOption[] | null>(null);
    const [models, setModels] = useState<CmsModel[]>([]);

    const [createContentModelFrom] = useMutation<
        CreateCmsModelFromMutationResponse,
        CreateCmsModelFromMutationVariables
    >(CREATE_CONTENT_MODEL_FROM, {
        onError(error) {
            setLoading(false);
            showWarningToast({ title: "Failed to create model", description: error.message });
        },
        update(cache, response) {
            if (!response.data) {
                showWarningToast({
                    title: "Failed to create model",
                    description: `Missing data on Create Content Model From Mutation Response.`
                });
                return;
            }
            const { data: model, error } = response.data.createContentModelFrom;

            if (error) {
                setLoading(false);
                showWarningToast({ title: "Failed to create model", description: error.message });
                return;
            }

            addModelToListCache(cache, model);
            addModelToGroupCache(cache, model);

            closeModal();
            goToRoute(Routes.ContentModels.List);
        }
    });

    const listMenuGroupsQuery = useQuery<ListMenuCmsGroupsQueryResponse>(
        LIST_MENU_CONTENT_GROUPS_MODELS
    );

    useEffect(() => {
        if (!listMenuGroupsQuery.data || listMenuGroupsQuery.loading) {
            return;
        }
        const options: CmsGroupOption[] = [];
        const models: CmsModel[] = [];
        const items = listMenuGroupsQuery.data.listContentModelGroups.data || [];
        for (const item of items) {
            options.push({
                value: item.slug,
                label: item.name
            });
            models.push(...item.contentModels);
        }
        setGroups(options);
        setModels(models);
    }, [listMenuGroupsQuery.data, listMenuGroupsQuery.loading]);

    const selectedGroup = getSelectedGroup(groups, contentModel);

    const nameValidator = useCallback(createNameValidator({ models }), [client, models]);

    const apiNameValidator = useCallback(createApiNameValidator({ client, models }), [
        client,
        models
    ]);

    return (
        <Dialog
            open={true}
            onClose={onClose}
            data-testid="cms-clone-content-model-modal"
            title={t`Clone Content Model`}
        >
            {!groups && <OverlayLoader text={"Please wait while we load required information."} />}

            <Form
                data={{
                    group: selectedGroup,
                    name: contentModel.name
                }}
                onSubmit={data => {
                    setLoading(true);
                    createContentModelFrom({
                        variables: {
                            modelId: contentModel.modelId,
                            /**
                             * We know that data is CmsModel
                             */
                            data: data as unknown as CmsModel
                        }
                    });
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        {loading && <OverlayLoader />}
                        <Grid>
                            <Grid.Column span={12}>
                                <Bind
                                    name={"name"}
                                    validators={[
                                        validation.create("required,maxLength:100"),
                                        nameValidator
                                    ]}
                                >
                                    <Input
                                        label={t`Name`}
                                        description={t`The name of the content model`}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind
                                    name={"singularApiName"}
                                    validators={[
                                        validation.create("required,maxLength:100"),
                                        apiNameValidator
                                    ]}
                                >
                                    <Input
                                        label={t`Singular API Name`}
                                        description={t`The API name of the content model. For example: AuthorCategory.`}
                                        data-testid="cms.newcontentmodeldialog.singularApiName"
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind
                                    name={"pluralApiName"}
                                    validators={[
                                        validation.create("required,maxLength:100"),
                                        apiNameValidator
                                    ]}
                                >
                                    <Input
                                        label={t`Plural API Name`}
                                        description={t`The plural API name of the content model. For example: AuthorCategories.`}
                                        data-testid="cms.newcontentmodeldialog.pluralApiName"
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name={"group"} validators={validation.create("required")}>
                                    <Select
                                        description={t`Choose a content model group`}
                                        label={t`Content model group`}
                                        options={groups || []}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name="icon">
                                    <IconPicker
                                        label={t`Icon`}
                                        description={t`Choose an icon to represent the model.`}
                                    />
                                </Bind>
                            </Grid.Column>
                            <Grid.Column span={12}>
                                <Bind name="description">
                                    <Textarea maxLength={200} label={t`Description`} />
                                </Bind>
                            </Grid.Column>
                        </Grid>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                marginTop: "16px"
                            }}
                        >
                            <Button
                                variant={"secondary"}
                                onClick={ev => {
                                    submit(ev);
                                }}
                            >
                                + {t`Clone`}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </Dialog>
    );
};
