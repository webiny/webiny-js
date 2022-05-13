import React, { useState, useCallback, useEffect } from "react";
import { css } from "emotion";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useMutation, useQueryLocale } from "../../hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import * as UID from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { addModelToGroupCache, addModelToListCache } from "./cache";
import { CmsEditorContentModel, CmsModel } from "~/types";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import {
    CREATE_CONTENT_MODEL_FROM,
    LIST_MENU_CONTENT_GROUPS_MODELS,
    CreateCmsModelFromMutationResponse,
    CreateCmsModelFromMutationVariables,
    ListMenuCmsGroupsQueryResponse
} from "../../viewsGraphql";
import { CmsGroup } from "~/admin/views/contentModelGroups/graphql";
import { CmsGroupOption } from "~/admin/views/contentModels/types";

const t = i18n.ns("app-headless-cms/admin/views/content-models/clone-content-model-dialog");

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

const noPadding = css({
    padding: "5px !important"
});

export interface Props {
    open: boolean;
    onClose: UID.DialogOnClose;
    contentModel: CmsEditorContentModel;
    closeModal: () => void;
}

/**
 * This list is to disallow creating models that might interfere with GraphQL schema creation.
 * Add more if required.
 */
const disallowedModelIdEndingList: string[] = ["Response", "List", "Meta", "Input", "Sorter"];

const getSelectedGroup = (
    groups: CmsGroupOption[] | null,
    model: CmsEditorContentModel
): string | null => {
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

const CloneContentModelDialog: React.FC<Props> = ({ open, onClose, contentModel, closeModal }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();
    const { getLocales, getCurrentLocale, setCurrentLocale } = useI18N();

    const currentLocale = getCurrentLocale("content");
    const [locale, setLocale] = useState<string>(currentLocale || "");
    const [groups, setGroups] = useState<CmsGroupOption[] | null>(null);

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
            label: code === currentLocale ? "Current locale" : code
        };
    });

    const { data, loading: groupsLoading } = useQueryLocale<ListMenuCmsGroupsQueryResponse>(
        LIST_MENU_CONTENT_GROUPS_MODELS,
        locale,
        {
            skip: !open || !!groups
        }
    );

    useEffect(() => {
        if (!data || groupsLoading) {
            return;
        }
        const contentModelGroups: CmsGroupOption[] = get(
            data,
            "listContentModelGroups.data",
            []
        ).map((item: CmsGroup): CmsGroupOption => {
            return {
                value: item.id,
                label: item.name
            };
        });
        setGroups(contentModelGroups);
    }, [data, groupsLoading]);

    const selectedGroup = getSelectedGroup(groups, contentModel);

    const nameValidator = useCallback((name: string) => {
        const target = (name || "").trim();
        if (!target.charAt(0).match(/[a-zA-Z]/)) {
            throw new Error("Value is not valid - must not start with a number.");
        }
        if (target.toLowerCase() === "id") {
            throw new Error('Value is not valid - "id" is an auto-generated field.');
        }
        for (const ending of disallowedModelIdEndingList) {
            const re = new RegExp(`${ending}$`, "i");
            const matched = target.match(re);
            if (matched === null) {
                continue;
            }
            throw new Error(`Model name that ends with "${ending}" is not allowed.`);
        }
        return true;
    }, []);

    return (
        <UID.Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-clone-content-model-modal"
        >
            {(!groups || groupsLoading) && (
                <CircularProgress label={"Please wait while we load required information."} />
            )}
            {open && (
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
                                <Grid className={noPadding}>
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
                                            name={"group"}
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                description={t`Choose a content model group`}
                                                label={t`Content model group`}
                                                options={groups || []}
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
                                                    value={contentModel.description}
                                                />
                                            )}
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
            )}
        </UID.Dialog>
    );
};

export default CloneContentModelDialog;
