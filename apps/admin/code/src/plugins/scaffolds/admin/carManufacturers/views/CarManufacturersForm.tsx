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
import { useCarManufacturersForm } from "./hooks/useCarManufacturersForm";

const CarManufacturersForm = () => {
    const {
        loading,
        emptyViewIsShown,
        currentCarManufacturer,
        cancelEditing,
        carManufacturer,
        onSubmit
    } = useCarManufacturersForm();

    // Render "No content" selected view.
    if (emptyViewIsShown) {
        return (
            <EmptyView
                title={
                    "Click on the left side list to display Car Manufacturers details or create a..."
                }
                action={
                    <ButtonDefault onClick={currentCarManufacturer}>
                        <ButtonIcon icon={<AddIcon />} /> {"New Car Manufacturer"}
                    </ButtonDefault>
                }
            />
        );
    }

    return (
        <Form data={carManufacturer} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.id || "New Car Manufacturer"} />
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
                        <ButtonDefault onClick={cancelEditing}>{"Cancel"}</ButtonDefault>
                        <ButtonPrimary onClick={form.submit}>
                            {"Save Car Manufacturer"}
                        </ButtonPrimary>
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default CarManufacturersForm;
