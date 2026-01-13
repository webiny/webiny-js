import React, { useCallback, useEffect, useState } from "react";
import * as UID from "@webiny/ui/Dialog/index.js";
import { useRouter } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input/index.js";
import { Select } from "@webiny/ui/Select/index.js";
import { useToast } from "@webiny/admin-ui";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { validation } from "@webiny/validation";
import { useApolloClient, useMutation, useQuery } from "../../hooks/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { ButtonDefault } from "@webiny/ui/Button/index.js";
import { Cell, Grid } from "@webiny/ui/Grid/index.js";
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
    onClose: UID.DialogOnClose;
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
        <Dialog open={true} onClose={onClose} data-testid="cms-clone-content-model-modal">
            {!groups && (
                <CircularProgress label={"Please wait while we load required information."} />
            )}

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
                        {loading && <CircularProgress />}
                        <UID.DialogTitle>{t`Clone Content Model`}</UID.DialogTitle>
                        <UID.DialogContent>
                            <Grid>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
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
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"group"} validators={validation.create("required")}>
                                        <Select
                                            description={t`Choose a content model group`}
                                            label={t`Content model group`}
                                            options={groups || []}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="icon">
                                        <IconPicker
                                            label={t`Icon`}
                                            description={t`Choose an icon to represent the model.`}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name="description">
                                        <Input rows={4} maxLength={200} label={t`Description`} />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </UID.DialogContent>
                        <UID.DialogActions>
                            <ButtonDefault
                                onClick={ev => {
                                    submit(ev);
                                }}
                            >
                                + {t`Clone`}
                            </ButtonDefault>
                        </UID.DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};
