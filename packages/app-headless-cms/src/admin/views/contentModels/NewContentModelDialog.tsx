import React, { useCallback, useMemo } from "react";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useApolloClient, useMutation, useQuery } from "../../hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import * as UID from "@webiny/ui/Dialog";
import { Cell, Grid } from "@webiny/ui/Grid";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { addModelToGroupCache, addModelToListCache } from "./cache";
import * as GQL from "../../viewsGraphql";
import {
    CreateCmsModelMutationResponse,
    CreateCmsModelMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql";
import { CmsModel } from "~/types";
import { CmsGroupOption } from "./types";
import { Dialog } from "~/admin/components/Dialog";
import { createApiNameValidator } from "~/admin/views/contentModels/helpers/apiNameValidator";
import { createNameValidator } from "~/admin/views/contentModels/helpers/nameValidator";
import { Checkbox } from "@webiny/ui/Checkbox";
import { IconPicker } from "~/admin/components/IconPicker";
import { Switch } from "@webiny/ui/Switch";

const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

export interface NewContentModelDialogProps {
    open: boolean;
    onClose: UID.DialogOnClose;
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
    const { history } = useRouter();
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

            history.push("/cms/content-models/" + model.modelId);
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
                value: item.id,
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
        <Dialog open={open} onClose={onClose} data-testid="cms-new-content-model-modal">
            {open && (
                <Form<CmsModelData> data={{ group, singleton: false }} onSubmit={onSubmit}>
                    {({ Bind, submit, data }) => {
                        return (
                            <>
                                {loading && (
                                    <CircularProgress label={"Creating content model..."} />
                                )}
                                <UID.DialogTitle>{t`New Content Model`}</UID.DialogTitle>
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
                                                    description={t`The name of the content model. Use the singular form, e.g. Author Category, not Author Categories.`}
                                                    data-testid="cms.newcontentmodeldialog.name"
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
                                            <Bind name={"singleton"} defaultValue={false}>
                                                <Switch
                                                    description={t`Create a model that can hold only one entry. Cannot be changed later.`}
                                                    label={t`Single entry model`}
                                                    data-testid="cms.newcontentmodeldialog.singleton"
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
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
                                        </Cell>
                                        <Cell span={12}>
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
                                                {props => (
                                                    <Input
                                                        {...props}
                                                        rows={4}
                                                        maxLength={200}
                                                        characterCount
                                                        label={t`Description`}
                                                        data-testid="cms.newcontentmodeldialog.description"
                                                    />
                                                )}
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind name={"defaultFields"} defaultValue={true}>
                                                <Checkbox
                                                    description={t`Create model with default title (text), description (long text) and image (file) fields`}
                                                    label={t`Create model with default fields`}
                                                    data-testid="cms.newcontentmodeldialog.defaultfields"
                                                />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </UID.DialogContent>
                                <UID.DialogActions>
                                    <ButtonPrimary onClick={submit}>
                                        + {t`Create Model`}
                                    </ButtonPrimary>
                                </UID.DialogActions>
                            </>
                        );
                    }}
                </Form>
            )}
        </Dialog>
    );
};

export default NewContentModelDialog;
