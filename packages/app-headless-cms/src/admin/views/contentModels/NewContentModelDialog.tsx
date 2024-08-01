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
import { CMS_MODEL_SINGLETON_TAG } from "~/admin/constants";

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

    const group = contentModelGroups.length > 0 ? contentModelGroups[0].value : null;

    const onSubmit = async (data: CmsModelData) => {
        setLoading(true);

        const tags: string[] = [];
        if (data.singleton) {
            tags.push(CMS_MODEL_SINGLETON_TAG);
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
    };

    return (
        <Dialog open={open} onClose={onClose} data-testid="cms-new-content-model-modal">
            {open && (
                <Form
                    data={{ group }}
                    onSubmit={data => {
                        /**
                         * We are positive that data is CmsModelData.
                         */
                        onSubmit(data as unknown as CmsModelData);
                    }}
                >
                    {({ Bind, submit }) => (
                        <>
                            {loading && <CircularProgress label={"Creating content model..."} />}
                            <UID.DialogTitle>{t`New Content Model`}</UID.DialogTitle>
                            <UID.DialogContent>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"singleton"} defaultValue={false}>
                                            <Checkbox
                                                description={t`Create a model as a single entry model (cannot be changed later)`}
                                                label={t`A single entry model`}
                                                data-testid="cms.newcontentmodeldialog.singleton"
                                            />
                                        </Bind>
                                    </Cell>
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
                                <ButtonPrimary
                                    onClick={ev => {
                                        submit(ev);
                                    }}
                                >
                                    + {t`Create Model`}
                                </ButtonPrimary>
                            </UID.DialogActions>
                        </>
                    )}
                </Form>
            )}
        </Dialog>
    );
};

export default NewContentModelDialog;
