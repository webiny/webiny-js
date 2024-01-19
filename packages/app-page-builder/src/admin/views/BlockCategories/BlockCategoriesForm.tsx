import React, { useCallback, useMemo } from "react";
import styled from "@emotion/styled";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation, useQuery } from "@apollo/react-hooks";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import IconPicker from "./IconPicker";
import { validation } from "@webiny/validation";
import { blockCategorySlugValidator, blockCategoryDescriptionValidator } from "./validators";
import {
    GET_BLOCK_CATEGORY,
    CREATE_BLOCK_CATEGORY,
    UPDATE_BLOCK_CATEGORY,
    LIST_BLOCK_CATEGORIES,
    GetBlockCategoryQueryResponse,
    GetBlockCategoryQueryVariables,
    UpdateBlockCategoryMutationResponse,
    UpdateBlockCategoryMutationVariables,
    CreateBlockCategoryMutationResponse,
    CreateBlockCategoryMutationVariables
} from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { PbBlockCategory } from "~/types";
import pick from "lodash/pick";
import get from "lodash/get";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { usePagesPermissions } from "~/hooks/permissions";

const t = i18n.ns("app-page-builder/admin/block-categories/form");

const ButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between"
});

interface CategoriesFormProps {
    canCreate: boolean;
}

const CategoriesForm: React.FC<CategoriesFormProps> = ({ canCreate }) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery<GetBlockCategoryQueryResponse, GetBlockCategoryQueryVariables>(
        GET_BLOCK_CATEGORY,
        {
            variables: {
                slug: slug as string
            },
            skip: !slug,
            onCompleted: data => {
                const error = data?.pageBuilder?.getBlockCategory?.error;
                if (error) {
                    history.push("/page-builder/block-categories");
                    showSnackbar(error.message);
                }
            }
        }
    );

    const loadedBlockCategory = getQuery.data?.pageBuilder?.getBlockCategory?.data || {
        slug: null,
        createdBy: {
            id: null
        }
    };

    const [create, createMutation] = useMutation<
        CreateBlockCategoryMutationResponse,
        CreateBlockCategoryMutationVariables
    >(CREATE_BLOCK_CATEGORY, {
        refetchQueries: [{ query: LIST_BLOCK_CATEGORIES }]
    });

    const [update, updateMutation] = useMutation<
        UpdateBlockCategoryMutationResponse,
        UpdateBlockCategoryMutationVariables
    >(UPDATE_BLOCK_CATEGORY, {
        refetchQueries: [{ query: LIST_BLOCK_CATEGORIES }],
        update: (cache, { data }) => {
            const blockCategoryDataFromCache = cache.readQuery<GetBlockCategoryQueryResponse>({
                query: GET_BLOCK_CATEGORY,
                variables: { slug }
            }) as GetBlockCategoryQueryResponse;
            const updatedBlockCategoryData = get(data, "pageBuilder.blockCategory.data");

            if (updatedBlockCategoryData) {
                cache.writeQuery<GetBlockCategoryQueryResponse, GetBlockCategoryQueryVariables>({
                    query: GET_BLOCK_CATEGORY,
                    data: set(
                        blockCategoryDataFromCache,
                        "pageBuilder.getBlockCategory.data",
                        updatedBlockCategoryData
                    )
                });
            }
        }
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const isUpdate = loadedBlockCategory.slug;
            const data = pick(formData, ["slug", "name", "icon", "description"]);

            let response;
            if (isUpdate) {
                response = await update({
                    variables: { slug: formData.slug, data }
                });
            } else {
                response = await create({
                    variables: {
                        data
                    }
                });
            }

            const error = response?.data?.pageBuilder?.blockCategory?.error;
            if (error) {
                showSnackbar(error.message);
                return;
            }

            if (!isUpdate) {
                history.push(`/page-builder/block-categories?slug=${formData.slug}`);
            }

            showSnackbar(t`Block Category saved successfully.`);
        },
        [loadedBlockCategory.slug]
    );

    const data = useMemo((): PbBlockCategory => {
        return getQuery.data?.pageBuilder?.getBlockCategory.data || ({} as PbBlockCategory);
    }, [loadedBlockCategory.slug]);

    const { canWrite } = usePagesPermissions();

    const canSave = useMemo(
        () => canWrite(loadedBlockCategory.createdBy.id),
        [loadedBlockCategory]
    );

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display block category details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <ButtonDefault
                            data-testid="new-record-button"
                            onClick={() => history.push("/page-builder/block-categories?new=true")}
                        >
                            <ButtonIcon icon={<AddIcon />} /> {t`New Block Category`}
                        </ButtonDefault>
                    ) : (
                        <></>
                    )
                }
            />
        );
    }

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm data-testid={'testid-xyz'} >
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.name || t`New block category`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind
                                    name="slug"
                                    validators={[
                                        validation.create("required"),
                                        blockCategorySlugValidator
                                    ]}
                                >
                                    <Input disabled={data.createdOn} label={t`Slug`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="icon"
                                    validators={validation.create("required")}
                                    defaultValue={"fas/star"}
                                >
                                    <IconPicker
                                        label={t`Category icon`}
                                        description={t`Icon that will be displayed in the page builder.`}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="description"
                                    validators={[
                                        validation.create("required"),
                                        blockCategoryDescriptionValidator
                                    ]}
                                >
                                    <Input label={t`Description`} />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonWrapper>
                            <ButtonDefault
                                onClick={() => history.push("/page-builder/block-categories")}
                            >{t`Cancel`}</ButtonDefault>
                            {canSave && (
                                <ButtonPrimary
                                    data-testid={"asd"}
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >{t`Save block category`}</ButtonPrimary>
                            )}
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default CategoriesForm;
