import React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonDefault, ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { validation } from "@webiny/validation";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { useTargetDataModelsForm } from "./hooks/useTargetDataModelsForm";

const TargetDataModelsForm = () => {
    const {
        loading,
        emptyViewIsShown,
        currentTargetDataModel,
        cancelEditing,
        target_data_model,
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
                        <ButtonIcon icon={<AddIcon />} /> {"New Target_data_model"}
                    </ButtonDefault>
                }
            />
        );
    }

    return (
        <Form data={target_data_model} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.id || "New Target Data Models"} />
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
                        <ButtonWrapper>
                            <ButtonDefault onClick={cancelEditing}>{"Cancel"}</ButtonDefault>
                            <ButtonPrimary onClick={form.submit}>
                                {"Save Target Data Models"}
                            </ButtonPrimary>
                        </ButtonWrapper>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default TargetDataModelsForm;
