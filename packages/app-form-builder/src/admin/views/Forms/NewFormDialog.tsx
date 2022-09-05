import React from "react";
import { css } from "emotion";
import { useRouter } from "@webiny/react-router";
import { useMutation } from "@apollo/react-hooks";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import {
    CREATE_FORM,
    CreateFormMutationResponse,
    CreateFormMutationVariables
} from "../../graphql";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("Forms.NewFormDialog");

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";
import { addFormToListCache } from "../cache";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

export interface NewFormDialogProps {
    open: boolean;
    onClose: DialogOnClose;
}

const NewFormDialog: React.FC<NewFormDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const [create] = useMutation<CreateFormMutationResponse, CreateFormMutationVariables>(
        CREATE_FORM
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="fb-new-form-modal"
        >
            <Form
                onSubmit={formData => {
                    setLoading(true);

                    create({
                        /**
                         * We know that formData is CreateFormMutationVariables.
                         */
                        variables: formData as unknown as CreateFormMutationVariables,
                        update(cache, result) {
                            if (!result.data) {
                                return;
                            }
                            const { data } = result;
                            const { data: revision, error } = data.formBuilder.form;

                            setLoading(false);
                            if (error) {
                                showSnackbar(error.message);
                                return;
                            } else if (!revision) {
                                showSnackbar(`Missing revision data in Create Form Mutation.`);
                                return;
                            }

                            addFormToListCache(cache, revision);

                            history.push(`/form-builder/forms/${encodeURIComponent(revision.id)}`);
                        }
                    });
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        {loading && <CircularProgress label={"Creating form..."} />}
                        <DialogTitle>{t`New form`}</DialogTitle>
                        <DialogContent>
                            <Bind name={"name"}>
                                <Input placeholder={"Enter a name for your new form"} />
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <ButtonDefault
                                data-testid="fb.form.create"
                                onClick={ev => {
                                    submit(ev);
                                }}
                            >
                                + {t`Create`}
                            </ButtonDefault>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default NewFormDialog;
