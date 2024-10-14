import React, { useState, useCallback, useEffect } from "react";
import * as UID from "@webiny/ui/Dialog";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useApolloClient, useMutation, useQueryLocale } from "../../hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { addModelToGroupCache, addModelToListCache } from "./cache";
import { CmsModel } from "~/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import {
    CREATE_CONTENT_MODEL_FROM,
    LIST_MENU_CONTENT_GROUPS_MODELS,
    CreateCmsModelFromMutationResponse,
    CreateCmsModelFromMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql";
import { CmsGroupOption } from "~/admin/views/contentModels/types";
import { Dialog } from "~/admin/components/Dialog";
import { createNameValidator } from "~/admin/views/contentModels/helpers/nameValidator";
import { createApiNameValidator } from "~/admin/views/contentModels/helpers/apiNameValidator";
import { IconPicker } from "@webiny/app-admin/components/IconPicker";

const t = i18n.ns("app-headless-cms/admin/views/content-models/clone-content-model-dialog");

const getSelectedGroup = (groups: CmsGroupOption[] | null, model: CmsModel): string | null => {
    if (!groups || groups.length === 0 || !model) {
        return "";
    }
    const current = model.group.id;
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
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { getLocales, getCurrentLocale, setCurrentLocale } = useI18N();
    const client = useApolloClient();

    const currentLocale = getCurrentLocale("content");
    const [locale, setLocale] = useState<string>(currentLocale || "");
    const [groups, setGroups] = useState<CmsGroupOption[] | null>(null);
    const [models, setModels] = useState<CmsModel[]>([]);

    const [createContentModelFrom] = useMutation<
        CreateCmsModelFromMutationResponse,
        CreateCmsModelFromMutationVariables
    >(CREATE_CONTENT_MODEL_FROM, {
        onError(error) {
            setLoading(false);
            showSnackbar(error.message);
        },
        update(cache, response) {
            if (!response.data) {
                showSnackbar(`Missing data on Create Content Model From Mutation Response.`);
                return;
            }
            const { data: model, error } = response.data.createContentModelFrom;

            if (error) {
                setLoading(false);
                showSnackbar(error.message);
                return;
            }

            if (currentLocale !== locale) {
                setCurrentLocale(locale, "content");
                window.location.reload();
                return;
            }

            addModelToListCache(cache, model);
            addModelToGroupCache(cache, model);

            history.push("/cms/content-models/");
            closeModal();
        }
    });

    const locales = getLocales().map(({ code }) => {
        return {
            value: code,
            label: code === currentLocale ? `Current locale (${code})` : code
        };
    });

    const listMenuGroupsQuery = useQueryLocale<ListMenuCmsGroupsQueryResponse>(
        LIST_MENU_CONTENT_GROUPS_MODELS,
        locale
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
                value: item.id,
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
                    locale,
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
                                        name={"locale"}
                                        validators={validation.create("required")}
                                        afterChange={(value?: string) => {
                                            if (!value) {
                                                return;
                                            }
                                            setLocale(value);
                                            setGroups(null);
                                        }}
                                    >
                                        <Select
                                            description={t`Choose a locale into which you wish to clone the model`}
                                            label={t`Content model locale`}
                                            options={locales}
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
                                        <Input
                                            rows={4}
                                            maxLength={200}
                                            characterCount
                                            label={t`Description`}
                                        />
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
