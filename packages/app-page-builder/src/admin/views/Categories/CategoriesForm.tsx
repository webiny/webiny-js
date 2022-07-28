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
import { validation } from "@webiny/validation";
import {
    GET_CATEGORY,
    CREATE_CATEGORY,
    UPDATE_CATEGORY,
    LIST_CATEGORIES,
    GetCategoryQueryResponse,
    GetCategoryQueryVariables,
    UpdateCategoryMutationResponse,
    UpdateCategoryMutationVariables,
    CreateCategoryMutationResponse,
    CreateCategoryMutationVariables
} from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { categoryUrlValidator } from "./validators";
import { plugins } from "@webiny/plugins";
import { PageBuilderSecurityPermission, PbCategory, PbPageLayoutPlugin } from "~/types";
import { Select } from "@webiny/ui/Select";
import { useSecurity } from "@webiny/app-security";
import pick from "lodash/pick";
import get from "lodash/get";
import set from "lodash/set";
import isEmpty from "lodash/isEmpty";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";

const t = i18n.ns("app-page-builder/admin/categories/form");

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

    const layouts = React.useMemo(() => {
        const layoutPlugins = plugins.byType<PbPageLayoutPlugin>("pb-page-layout");
        return (layoutPlugins || []).map(pl => pl.layout);
    }, []);
    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery<GetCategoryQueryResponse, GetCategoryQueryVariables>(GET_CATEGORY, {
        variables: {
            slug: slug as string
        },
        skip: !slug,
        onCompleted: data => {
            const error = data?.pageBuilder?.getCategory?.error;
            if (error) {
                history.push("/page-builder/categories");
                showSnackbar(error.message);
            }
        }
    });

    const loadedCategory = getQuery.data?.pageBuilder?.getCategory?.data || {
        slug: null,
        createdBy: {
            id: null
        }
    };

    const [create, createMutation] = useMutation<
        CreateCategoryMutationResponse,
        CreateCategoryMutationVariables
    >(CREATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const [update, updateMutation] = useMutation<
        UpdateCategoryMutationResponse,
        UpdateCategoryMutationVariables
    >(UPDATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }],
        update: (cache, { data }) => {
            const categoryDataFromCache = cache.readQuery<GetCategoryQueryResponse>({
                query: GET_CATEGORY,
                variables: { slug }
            }) as GetCategoryQueryResponse;
            const updatedCategoryData = get(data, "pageBuilder.category.data");

            if (updatedCategoryData) {
                cache.writeQuery<GetCategoryQueryResponse, GetCategoryQueryVariables>({
                    query: GET_CATEGORY,
                    data: set(
                        categoryDataFromCache,
                        "pageBuilder.getCategory.data",
                        updatedCategoryData
                    )
                });
            }
        }
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const isUpdate = loadedCategory.slug;
            const data = pick(formData, ["slug", "name", "url", "layout"]);

            // const [operation, args] = isUpdate
            //     ? [update, { variables: { slug: formData.slug, data } }]
            //     : [create, { variables: { data } }];

            // const response = await operation(args);

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

            const error = response?.data?.pageBuilder?.category?.error;
            if (error) {
                showSnackbar(error.message);
                return;
            }

            if (!isUpdate) {
                history.push(`/page-builder/categories?slug=${formData.slug}`);
            }

            showSnackbar(t`Category saved successfully.`);
        },
        [loadedCategory.slug]
    );

    const data = useMemo((): PbCategory => {
        return getQuery.data?.pageBuilder?.getCategory.data || ({} as PbCategory);
    }, [loadedCategory.slug]);

    const { identity, getPermission } = useSecurity();
    const pbMenuPermission = useMemo((): PageBuilderSecurityPermission | null => {
        return getPermission("pb.category");
    }, [identity]);

    const canSave = useMemo((): boolean => {
        if (!pbMenuPermission) {
            return false;
        }
        // User should be able to save the form
        // if it's a new entry and user has the "own" permission set.
        if (!loadedCategory.slug && pbMenuPermission.own) {
            return true;
        }

        if (pbMenuPermission.own) {
            const identityId = identity ? identity.id || identity.login : null;
            return loadedCategory?.createdBy?.id === identityId;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
        }

        return true;
    }, [loadedCategory.slug]);

    const showEmptyView = !newEntry && !loading && isEmpty(data);
    // Render "No content selected" view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display category details {message}`({
                    message: canCreate ? "or create a..." : ""
                })}
                action={
                    canCreate ? (
                        <ButtonDefault
                            data-testid="new-record-button"
                            onClick={() => history.push("/page-builder/categories?new=true")}
                        >
                            <ButtonIcon icon={<AddIcon />} /> {t`New Category`}
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
                    <SimpleFormHeader title={data.name || t`New category`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input
                                        label={t`Name`}
                                        data-testid="pb.category.new.form.name"
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
                                    <Input
                                        disabled={data.createdOn}
                                        label={t`Slug`}
                                        data-testid="pb.category.new.form.slug"
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="url"
                                    validators={[
                                        validation.create("required"),
                                        categoryUrlValidator
                                    ]}
                                >
                                    <Input
                                        disabled={data.id}
                                        label={t`URL`}
                                        data-testid="pb.category.new.form.url"
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind
                                    name="layout"
                                    defaultValue={layouts.length ? layouts[0].name : ""}
                                >
                                    <Select
                                        label={t`Layout`}
                                        data-testid="pb.category.new.form.layout"
                                    >
                                        {layouts.map(({ name, title }) => (
                                            <option key={name} value={name}>
                                                {title}
                                            </option>
                                        ))}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonWrapper>
                            <ButtonDefault
                                onClick={() => history.push("/page-builder/categories")}
                                data-testid="pb.category.new.form.button.cancel"
                            >{t`Cancel`}</ButtonDefault>
                            {canSave && (
                                <ButtonPrimary
                                    data-testid="pb.category.new.form.button.save"
                                    onClick={ev => {
                                        form.submit(ev);
                                    }}
                                >{t`Save category`}</ButtonPrimary>
                            )}
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default CategoriesForm;
