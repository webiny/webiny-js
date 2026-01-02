import React, { useState } from "react";
import type { FormAPI, FormOnSubmit } from "@webiny/form";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import type { CmsDynamicZoneTemplate } from "~/types.js";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { IconPicker } from "~/admin/components/IconPicker.js";
import { Tags } from "@webiny/ui/Tags/index.js";
import { Alert, Dialog, Grid, Input, Textarea } from "@webiny/admin-ui";

const typeNameValidator = (value: string) => {
    const regex = new RegExp("^[A-Z]+[_0-9A-Za-z]+$");
    if (regex.test(value)) {
        return true;
    }

    throw Error(
        `Must start with a capital letter, may contain numbers, and must not contain spaces.`
    );
};

const getGraphQLTypeName = (value: string) => {
    const titleCase = value.charAt(0).toUpperCase() + value.slice(1);
    return titleCase.replace(/[^a-zA-Z0-9]/g, "");
};

interface TemplateDialogProps {
    onClose: () => void;
    template?: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateDialog = (props: TemplateDialogProps) => {
    const [showWarning, setWarning] = useState(false);
    const newTemplate = !Boolean(props.template);
    const dialogTitle = newTemplate ? "Add Template" : "Edit Template";
    const submitLabel = newTemplate ? "Add Template" : "Update Template";

    const onSubmit: FormOnSubmit<CmsDynamicZoneTemplate> = template => {
        if (template.id) {
            props.onTemplate(template);
        } else {
            props.onTemplate({
                ...template,
                id: generateAlphaNumericLowerCaseId(),
                fields: [],
                layout: []
            });
        }
        props.onClose();
    };

    const showGqlTypeNameWarning = () => {
        setWarning(true);
    };

    const hideGqlTypeNameWarning = () => {
        setWarning(false);
    };

    const checkGqlType: FormOnSubmit<CmsDynamicZoneTemplate> = data => {
        if (newTemplate) {
            return;
        }

        if (data.gqlTypeName !== props.template?.gqlTypeName) {
            showGqlTypeNameWarning();
        } else {
            hideGqlTypeNameWarning();
        }
    };

    const nameOnBlur = (form: FormAPI<CmsDynamicZoneTemplate>) => () => {
        if (!form.data.gqlTypeName) {
            /**
             * There is a possibility that name is undefined, so let's check for it.
             */
            const name = form.data.name;
            if (!name) {
                return;
            }
            form.setValue("gqlTypeName", getGraphQLTypeName(name));
        }
    };

    const onFormChange: FormOnSubmit<CmsDynamicZoneTemplate> = (data, form) => {
        checkGqlType(data, form);
    };

    return (
        <Form<CmsDynamicZoneTemplate>
            onSubmit={onSubmit}
            data={props.template}
            onChange={onFormChange}
        >
            {({ Bind, submit, form }) => (
                <Dialog
                    open={true}
                    onClose={props.onClose}
                    title={dialogTitle}
                    actions={
                        <>
                            <Dialog.CancelAction />
                            <Dialog.ConfirmAction onClick={submit} text={submitLabel} />
                        </>
                    }
                >
                    <Grid>
                        <>
                            {showWarning ? (
                                <Grid.Column span={12}>
                                    <Alert title={"GraphQL Schema Change"} type={"danger"}>
                                        You&apos;ve changed the GraphQL schema type name! If your
                                        API is being queried by a 3rd party application, this will
                                        affect the GraphQL queries in those applications. Make sure
                                        your consumers are informed about this change!
                                    </Alert>
                                </Grid.Column>
                            ) : null}
                        </>
                        <Grid.Column span={12}>
                            <Bind name={"name"} validators={[validation.create("required")]}>
                                <Input label={"Name"} onBlur={nameOnBlur(form)} />
                            </Bind>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Bind
                                name={"gqlTypeName"}
                                validators={[validation.create("required"), typeNameValidator]}
                            >
                                <Input
                                    autoFocus={false}
                                    label={"GraphQL Type Name"}
                                    description={
                                        "This string will be used to generate the GraphQL schema. "
                                    }
                                />
                            </Bind>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Bind name={"icon"} validators={[validation.create("required")]}>
                                <IconPicker label={"Icon"} />
                            </Bind>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Bind name={"description"} validators={[validation.create("required")]}>
                                <Textarea rows={3} label={"Description"} />
                            </Bind>
                        </Grid.Column>
                        <Grid.Column span={12}>
                            <Bind name={"tags"} defaultValue={[]}>
                                <Tags label={"Tags"} />
                            </Bind>
                        </Grid.Column>
                    </Grid>
                </Dialog>
            )}
        </Form>
    );
};
