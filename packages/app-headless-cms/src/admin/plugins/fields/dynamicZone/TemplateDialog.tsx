import React from "react";
import { ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Form, FormOnSubmit } from "@webiny/form";
import { validation } from "@webiny/validation";
import { CmsDynamicZoneTemplate } from "~/types";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { IconPicker } from "~/admin/components/IconPicker";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "~/admin/components/Dialog";

interface TemplateDialogProps {
    onClose: () => void;
    template?: CmsDynamicZoneTemplate;
    onTemplate: (template: CmsDynamicZoneTemplate) => void;
}

export const TemplateDialog = (props: TemplateDialogProps) => {
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

    return (
        <Dialog open={true} onClose={props.onClose}>
            <Form<CmsDynamicZoneTemplate> onSubmit={onSubmit} data={props.template}>
                {({ Bind, submit }) => (
                    <>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogContent>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name={"name"}
                                        validators={[validation.create("required,minLength:3")]}
                                    >
                                        <Input label={"Name"} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name={"icon"}
                                        validators={[validation.create("required")]}
                                    >
                                        <IconPicker label={"Icon"} />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name={"description"}
                                        validators={[validation.create("required")]}
                                    >
                                        <Input rows={3} label={"Description"} />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <ButtonDefault onClick={props.onClose}>Cancel</ButtonDefault>
                            <ButtonPrimary onClick={submit}>{submitLabel}</ButtonPrimary>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};
