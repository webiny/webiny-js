import React, { useCallback, useState } from "react";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { Validator } from "@webiny/validation/types";
import { PbPageTemplate } from "~/types";

const narrowDialog = css`
    & .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

const slugValidator: Validator = (value: string) => {
    if (!value.match(/^[a-z]+(\-[a-z]+)*$/)) {
        throw new Error(
            "Page template slug must consist of only 'a-z' and '-' characters (for example: 'page-template-slug')."
        );
    }

    if (value.length > 100) {
        throw new Error("Page Template slug must be shorter than 100 characters.");
    }

    return true;
};

type CreatePageTemplateDialogProps = {
    onClose: () => void;
    onSubmit: (formData: Pick<PbPageTemplate, "title" | "slug" | "description">) => Promise<void>;
};

const CreatePageTemplateDialog = ({ onClose, onSubmit }: CreatePageTemplateDialogProps) => {
    const [loading, setLoading] = useState(false);
    const submitForm = useCallback(
        async (formData: PbPageTemplate) => {
            setLoading(true);
            await onSubmit(formData);
            setLoading(false);
        },
        [onSubmit]
    );

    return (
        <Dialog open={true} onClose={onClose} className={narrowDialog}>
            <Form onSubmit={submitForm}>
                {({ form, Bind }) => (
                    <>
                        <DialogTitle>Create Page Template</DialogTitle>
                        <DialogContent>
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={6}>
                                        <Bind
                                            name="title"
                                            validators={[validation.create("required")]}
                                        >
                                            <Input label="Title" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind
                                            name="slug"
                                            validators={[
                                                validation.create("required"),
                                                slugValidator
                                            ]}
                                        >
                                            <Input label="Slug" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name="description"
                                            validators={[validation.create("required")]}
                                        >
                                            <Input rows={2} label="Description" />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </SimpleFormContent>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel disabled={loading}>Cancel</DialogCancel>
                            <ButtonPrimary disabled={loading} onClick={form.submit}>
                                Create
                            </ButtonPrimary>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default CreatePageTemplateDialog;
