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
import { GET_CATEGORY, CREATE_CATEGORY, UPDATE_CATEGORY, LIST_CATEGORIES } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { categoryUrlValidator } from "./validators";
import { plugins } from "@webiny/plugins";
import { PbPageLayoutPlugin } from "../../../types";
import { Select } from "@webiny/ui/Select";
import { useSecurity } from "@webiny/app-security";
import pick from "object.pick";
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

type CategoriesFormProps = {
    canCreate: boolean;
};
const CategoriesForm = ({ canCreate }: CategoriesFormProps) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const layouts = React.useMemo(
        () => plugins.byType<PbPageLayoutPlugin>("pb-page-layout").map(pl => pl.layout),
        []
    );
    const newEntry = new URLSearchParams(location.search).get("new") === "true";
    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery(GET_CATEGORY, {
        variables: { slug },
        skip: !slug,
        onCompleted: data => {
            const error = data?.pageBuilder?.getCategory?.error;
            if (error) {
                history.push("/page-builder/categories");
                showSnackbar(error.message);
            }
        }
    });

    const loadedCategory = getQuery.data?.pageBuilder?.getCategory?.data || {};

    const [create, createMutation] = useMutation(CREATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const [update, updateMutation] = useMutation(UPDATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }],
        update: (cache, { data }) => {
            const categoryDataFromCache = cache.readQuery<Record<string, any>>({
                query: GET_CATEGORY,
                variables: { slug }
            });
            const updatedCategoryData = get(data, "pageBuilder.category.data");

            if (updatedCategoryData) {
                cache.writeQuery({
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

            const [operation, args] = isUpdate
                ? [update, { variables: { slug: formData.slug, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.pageBuilder?.category?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/page-builder/categories?slug=${formData.slug}`);
            showSnackbar(t`Category saved successfully.`);
        },
        [loadedCategory.slug]
    );

    const data = useMemo(() => {
        return getQuery.data?.pageBuilder?.getCategory.data || {};
    }, [loadedCategory.slug]);

    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.category");
    }, []);

    const canSave = useMemo(() => {
        // User should be able to save the form
        // if it's a new entry and user has the "own" permission set.
        if (!loadedCategory.slug && pbMenuPermission.own) {
            return true;
        }

        if (pbMenuPermission.own) {
            const identityId = identity.id || identity.login;
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
                    ) : null
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
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
                                    <Input disabled={data.createdOn} label={t`Slug`} />
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
                                    <Input disabled={data.id} label={t`URL`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="layout" defaultValue={layouts[0].name}>
                                    <Select label={t`Layout`}>
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
                            >{t`Cancel`}</ButtonDefault>
                            {canSave && (
                                <ButtonPrimary
                                    onClick={form.submit}
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
