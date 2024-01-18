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
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
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

const CategoriesForm = ({ canCreate }: CategoriesFormProps) => {
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
                <SimpleForm>
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
                                    defaultValue={{
                                        type: "icon",
                                        name: "regular_star",
                                        value: '<path fill="currentColor" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3l153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4L459.8 484c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6l68.6-141.3C270.4 5.2 278.7 0 287.9 0zm0 79l-52.5 108.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9l85.9 85.1c5.5 5.5 8.1 13.3 6.8 21l-20.3 119.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2l-20.2-119.6c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1l-118.3-17.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/>',
                                        width: 576
                                    }}
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
                                    data-testid={"pb-block-categories-form-save-block-category-btn"}
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
