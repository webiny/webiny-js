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
import { CREATE_TARGET, READ_TARGET, UPDATE_TARGET } from "./graphql";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { TargetItem, TargetItemUserFields } from "../types";
import { addToListCache, updateToListCache } from "./cache";

const t = i18n.ns("admin-app-target/form");

const pickTargetData = (item: TargetItem): TargetItemUserFields => {
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

const TargetForm: React.FunctionComponent<Props> = ({ limit, sortBy }) => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const searchParams = new URLSearchParams(location.search);
    const newTarget = searchParams.get("new") === "true";
    const id = searchParams.get("id");

    const getQuery = useQuery(READ_TARGET, {
        variables: { id },
        skip: !id,
        onCompleted: data => {
            const error = dotProp.get(data, "targets.getTarget.data.error", null);
            if (!error) {
                return;
            }

            history.push("/targets");
            showSnackbar(error.message || "Unspecified error.");
        }
    });

    const [createTarget, createMutation] = useMutation(CREATE_TARGET);
    const [updateTarget, updateMutation] = useMutation(UPDATE_TARGET);

    const onSubmit = useCallback(
        async (formData: TargetItem) => {
            const isUpdate = !!formData.createdOn;
            const data = pickTargetData(formData);
            const listVariables = {
                sort: [sortBy],
                limit
            };
            if (isUpdate) {
                await updateTarget({
                    variables: {
                        id: formData.id,
                        data: data
                    },
                    update: (cache, response) => {
                        const updateTargetResponse = dotProp.get(
                            response,
                            "data.targets.updateTarget",
                            null
                        );
                        if (!updateTargetResponse) {
                            return showSnackbar(
                                t`There is no "data.targets.updateTarget" in the response.`
                            );
                        }
                        const { data: target, error } = updateTargetResponse;
                        if (error) {
                            return showSnackbar(error.message);
                        } else if (!target) {
                            return showSnackbar(t`There is no Target data in the response.`);
                        }
                        updateToListCache(cache, listVariables, target);

                        showSnackbar(t`Target saved successfully.`);
                    }
                });
                return;
            }
            await createTarget({
                variables: {
                    data: data
                },
                update: (cache, response) => {
                    const createTargetResponse = dotProp.get(
                        response,
                        "data.targets.createTarget",
                        null
                    );
                    if (!createTargetResponse) {
                        return showSnackbar(
                            t`There is no "data.targets.createTarget" in the response.`
                        );
                    }
                    const { data: target, error } = createTargetResponse;
                    if (error) {
                        return showSnackbar(error.message);
                    } else if (!target) {
                        return showSnackbar(t`There is no Target data in the response.`);
                    }
                    addToListCache(cache, listVariables, target);

                    history.push(`/targets/?id=${encodeURIComponent(target.id)}`);

                    showSnackbar(t`Target saved successfully.`);
                }
            });
        },
        [id]
    );

    const loading = [getQuery, createMutation, updateMutation].some(item => !!item.loading);

    const targetData = dotProp.get(getQuery, "data.targets.getTarget.data", null);

    const showEmptyView = !newTarget && !loading && !targetData;
    // Render "No content" selected view.
    if (showEmptyView) {
        return (
            <EmptyView
                title={t`Click on the left side list to display target details or create a...`}
                action={
                    <ButtonDefault
                        data-testid="new-target-button"
                        onClick={() => history.push("/targets?new=true")}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Target`}
                    </ButtonDefault>
                }
            />
        );
    }
    const data = targetData || {};
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
                                        label={"A nice target"}
                                        description={
                                            "Check if the target is considered to be nice."
                                        }
                                    />
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonPrimary onClick={form.submit}>{t`Save target`}</ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default TargetForm;
