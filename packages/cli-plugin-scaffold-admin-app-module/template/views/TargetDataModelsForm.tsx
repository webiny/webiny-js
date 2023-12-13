import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { validation } from "@webiny/validation";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { useTargetDataModelsForm } from "./hooks/useTargetDataModelsForm";

/**
 * Renders a form which enables creating new or editing existing Target Data Model entries.
 * Includes two basic fields - title (required) and description.
 * The form submission-related functionality is located in the `useTargetDataModelsForm` React hook.
 */
const TargetDataModelsForm = () => {
    const {
        loading,
        emptyViewIsShown,
        currentTargetDataModel,
        cancelEditing,
        targetDataModel,
        onSubmit
    } = useTargetDataModelsForm();

    // Render "No content" selected view.
    if (emptyViewIsShown) {
        return (
            <EmptyView
                title={
                    "Click on the left side list to display Target Data Models details or create a..."
                }
                action={
                    <ButtonDefault onClick={currentTargetDataModel}>
                        <ButtonIcon icon={<AddIcon />} /> {"New Target Data Model"}
                    </ButtonDefault>
                }
            />
        );
    }

    return (
        <Form data={targetDataModel} onSubmit={onSubmit}>
            {({ data, submit, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.title || "New Target Data Model"} />
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
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        <ButtonDefault onClick={cancelEditing}>Cancel</ButtonDefault>
                        <ButtonPrimary
                            onClick={ev => {
                                submit(ev);
                            }}
                        >
                            Save Target Data Model
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default TargetDataModelsForm;
