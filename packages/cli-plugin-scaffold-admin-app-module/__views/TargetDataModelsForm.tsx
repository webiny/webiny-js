import React, { useCallback } from "react";
import dotProp from "dot-prop-immutable";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { Switch } from "@webiny/ui/Switch";
import { validation } from "@webiny/validation";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { CREATE_TARGET_DATA_MODEL, READ_TARGET_DATA_MODEL, UPDATE_TARGET_DATA_MODEL } from "./graphql";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { Target_data_modelItem, Target_data_modelItemUserFields } from "../types";
import { addToListCache, updateToListCache } from "./cache";

const t = i18n.ns("admin-app-target_data_model/form");

const pickTarget_data_modelData = (item: Target_data_modelItem): Target_data_modelItemUserFields => {
    return {
        title: item.title,
        description: item.description,
        isNice: item.isNice
    };
};

interface Props {
    limit: number;
    sortBy: string;
}

const TargetDataModelsForm: React.FunctionComponent<Props> = ({ limit, sortBy }) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const newTarget_data_model = searchParams.get("new") === "true";
    const id = searchParams.get("id");

    const getQuery = useQuery(READ_TARGET_DATA_MODEL, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = dotProp.get(data, "target_data_models.getTarget_data_model.data.error", null);
            if (!error) {
                return;
            }

            history.push("/target-data-models");
            showSnackbar(error.message || "Unspecified error.");
        }
    });

    const [currentTargetDataModel, createMutation] = useMutation(CREATE_TARGET_DATA_MODEL);
    const [updateTarget_data_model, updateMutation] = useMutation(UPDATE_TARGET_DATA_MODEL);

    const onSubmit = useCallback(
        async (formData: Target_data_modelItem) => {
            const isUpdate = !!formData.createdOn;
            const data = pickTarget_data_modelData(formData);
            const listVariables = {
                sort: [sortBy],
                limit
            };
            if (isUpdate) {
                await updateTarget_data_model({
                    variables: {
                        id: formData.id,
                        data: data
                    },
                    update: (cache, response) => {
                        const updateTarget_data_modelResponse = dotProp.get(
                            response,
                            "data.target_data_models.updateTarget_data_model",
                            null
                        );
                        if (!updateTarget_data_modelResponse) {
                            return showSnackbar(
                                t`There is no "data.target_data_models.updateTarget_data_model" in the response.`
                            );
                        }
                        const { data: target_data_model, error } = updateTarget_data_modelResponse;
                        if (error) {
                            return showSnackbar(error.message);
                        } else if (!target_data_model) {
                            return showSnackbar(t`There is no Target_data_model data in the response.`);
                        }
                        updateToListCache(cache, listVariables, target_data_model);

                        showSnackbar(t`Target_data_model saved successfully.`);
                    }
                });
                return;
            }
            await currentTargetDataModel({
                variables: {
                    data: data
                },
                update: (cache, response) => {
                    const currentTargetDataModelResponse = dotProp.get(
                        response,
                        "data.target_data_models.currentTargetDataModel",
                        null
                    );
                    if (!currentTargetDataModelResponse) {
                        return showSnackbar(
                            t`There is no "data.target_data_models.currentTargetDataModel" in the response.`
                        );
                    }
                    const { data: target_data_model, error } = currentTargetDataModelResponse;
                    if (error) {
                        return showSnackbar(error.message);
                    } else if (!target_data_model) {
                        return showSnackbar(t`There is no Target_data_model data in the response.`);
                    }
                    addToListCache(cache, listVariables, target_data_model);

                    history.push(`/target-data-models/?id=${encodeURIComponent(target_data_model.id)}`);

                    showSnackbar(t`Target_data_model saved successfully.`);
                }
            });
        },
        [id]
    );

    const loading = [getQuery, createMutation, updateMutation].some(item => !!item.loading);

    const target_data_modelData = dotProp.get(getQuery, "data.target_data_models.getTarget_data_model.data", null);

    const showEmptyView = !newTarget_data_model && !loading && !target_data_modelData;
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display target_data_model details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-target_data_model-button"
                        onClick={() => history.push("/target-data-models?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Target_data_model`}
                    </ButtonDefault>
                }
            />
        );
    }
    const data = target_data_modelData || {};
    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.title || "Untitled"} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={12}>
                                <Bind name="title" validators={validation.create("required")}>
                                    <Input label={"Title"} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="description"
                                    validators={validation.create("maxLength:500")}
                                >
                                    <Input
                                        label={"Description"}
                                        description={"Provide a short description here."}
                                        rows={4}
                                    />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind name="isNice">
                                    <Switch
                                        label={"A nice target_data_model"}
                                        description={
                                            "Check if the target_data_model is considered to be nice."
                                        }
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save target_data_model`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default TargetDataModelsForm;
