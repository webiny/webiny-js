import React, { useCallback, useMemo } from "react";
import { useRouter, useSnackbar } from "@webiny/app-admin";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input/index.js";
import { Select } from "@webiny/ui/Select/index.js";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import { validation } from "@webiny/validation";
import { useApolloClient, useMutation, useQuery } from "../../hooks/index.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Dialog, DialogProps, Grid } from "@webiny/admin-ui";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { addModelToGroupCache, addModelToListCache } from "./cache.js";
import type {
    CreateCmsModelMutationResponse,
    CreateCmsModelMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql.js";
import * as GQL from "../../viewsGraphql.js";
import type { CmsModel } from "~/types.js";
import type { CmsGroupOption } from "./types.js";
import { createApiNameValidator } from "~/admin/views/contentModels/helpers/apiNameValidator.js";
import { createNameValidator } from "~/admin/views/contentModels/helpers/nameValidator.js";
import { Checkbox } from "@webiny/ui/Checkbox/index.js";
import { IconPicker } from "~/admin/components/IconPicker.js";
import { Switch } from "@webiny/ui/Switch/index.js";
import { Routes } from "~/routes.js";
import { ScrollArea } from "@webiny/admin-ui/ScrollArea";

const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

export interface NewContentModelDialogProps {
    open: boolean;
    onClose: DialogProps["onClose"];
}

interface CmsModelData {
    name: string;
    description: string;
    group: string;
    singleton?: boolean;
    singularApiName: string;
    pluralApiName: string;
    defaultFields: boolean;
}

const NewContentModelDialog = ({ open, onClose }: NewContentModelDialogProps) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { goToRoute } = useRouter();
    const client = useApolloClient();

    const [createContentModel] = useMutation<
        CreateCmsModelMutationResponse,
        CreateCmsModelMutationVariables
    >(GQL.CREATE_CONTENT_MODEL, {
        onCompleted(data) {
            setLoading(false);

            if (!data) {
                showSnackbar("Missing data on Create Content Model Mutation Response.");
                return;
            }

            const { data: model, error } = data.createContentModel;

            if (error) {
                setLoading(false);
                showSnackbar(error.message);
                return;
            }

            goToRoute(Routes.ContentModels.Editor, { modelId: model.modelId });
        },
        update(cache, { data }) {
            if (!data) {
                return;
            }

            const { data: model, error } = data.createContentModel;

            if (error) {
                return;
            }

            addModelToListCache(cache, model);
            addModelToGroupCache(cache, model);
        }
    });

    const listMenuGroupsQuery = useQuery<ListMenuCmsGroupsQueryResponse>(
        GQL.LIST_MENU_CONTENT_GROUPS_MODELS,
        {
            skip: !open
        }
    );

    const groups = useMemo(() => {
        return listMenuGroupsQuery.data?.listContentModelGroups?.data || [];
    }, [listMenuGroupsQuery.data]);

    const contentModelGroups = useMemo(() => {
        return groups.map((item): CmsGroupOption => {
            return {
                value: item.slug,
                label: item.name
            };
        });
    }, [groups]);

    const models = useMemo(() => {
        return groups.reduce<CmsModel[]>((collection, group) => {
            collection.push(...group.contentModels);
            return collection;
        }, []);
    }, [groups]);

    const nameValidator = useCallback(createNameValidator({ models }), [models]);

    const apiNameValidator = useCallback(createApiNameValidator({ client, models }), [
        client,
        models
    ]);

    const group = useMemo<string | undefined>(() => {
        if (!contentModelGroups.length) {
            return undefined;
        }
        return contentModelGroups[0]?.value;
    }, [contentModelGroups]);

    const onSubmit = useCallback(
        async (data: CmsModelData) => {
            setLoading(true);
            /**
             * We need to make sure that tags are always an array.
             * At the moment there is no tags on the CmsModelData type.
             * If it is added at some point, the @ts-expect-error should be removed - it will cause TS error.
             */
            // @ts-expect-error
            const tags: string[] = Array.isArray(data.tags) ? data.tags : [];
            /**
             * If a model is a singleton, we add a special tag to it.
             * + we need to put the pluralApiName to something that is not used.
             */
            if (data.singleton) {
                tags.push(CMS_MODEL_SINGLETON_TAG);
                data.pluralApiName = `${data.singularApiName}Unused`;
            }
            delete data.singleton;
            await createContentModel({
                variables: {
                    data: {
                        ...data,
                        tags
                    }
                }
            });
        },
        [loading, createContentModel]
    );

    return (
        <Form<CmsModelData> data={{ group, singleton: false }} onSubmit={onSubmit}>
            {({ Bind, submit, data }) => {
                return (
                    <Dialog
                        open={open}
                        onClose={onClose}
                        data-testid="cms-new-content-model-modal"
                        title={t`New Content Model`}
                        actions={
                            <Dialog.ConfirmAction onClick={submit}>
                                + {t`Create Model`}
                            </Dialog.ConfirmAction>
                        }
                    >
                        <>
                            {loading && <CircularProgress label={"Creating content model..."} />}
                            <ScrollArea className="max-h-[70vh] flex flex-col">
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
                                                description={t`The name of the content model. Use the singular form, e.g. Author Category, not Author Categories.`}
                                                data-testid="cms.newcontentmodeldialog.name"
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
                                        <Bind name={"singleEntry"} defaultValue={false}>
                                            <Switch
                                                description={t`Create a model that can hold only one entry. Cannot be changed later.`}
                                                label={t`Single entry model`}
                                                data-testid="cms.newcontentmodeldialog.singleton"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name={"pluralApiName"}
                                            validators={
                                                data.singleton
                                                    ? []
                                                    : [
                                                          validation.create(
                                                              "required,maxLength:100"
                                                          ),
                                                          apiNameValidator
                                                      ]
                                            }
                                        >
                                            <Input
                                                disabled={data.singleton}
                                                label={t`Plural API Name`}
                                                description={t`The plural API name of the content model. For example: AuthorCategories.`}
                                                data-testid="cms.newcontentmodeldialog.pluralApiName"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind
                                            name={"group"}
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                description={t`Choose a content model group`}
                                                label={t`Content model group`}
                                                options={contentModelGroups}
                                                data-testid="cms.newcontentmodeldialog.selectgroup"
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
                                            {props => (
                                                <Input
                                                    {...props}
                                                    rows={4}
                                                    maxLength={200}
                                                    label={t`Description`}
                                                    data-testid="cms.newcontentmodeldialog.description"
                                                />
                                            )}
                                        </Bind>
                                    </Grid.Column>
                                    <Grid.Column span={12}>
                                        <Bind name={"defaultFields"} defaultValue={true}>
                                            <Checkbox
                                                description={t`Create model with default title (text), description (long text) and image (file) fields`}
                                                label={t`Create model with default fields`}
                                                data-testid="cms.newcontentmodeldialog.defaultfields"
                                            />
                                        </Bind>
                                    </Grid.Column>
                                </Grid>
                            </ScrollArea>
                        </>
                    </Dialog>
                );
            }}
        </Form>
    );
};

export default NewContentModelDialog;
