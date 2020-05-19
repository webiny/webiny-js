import React from "react";
import { css } from "emotion";
import { Form } from "@webiny/form";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@webiny/ui/Dialog";
import { I18NValue } from "@webiny/app-i18n/components";
import { Typography } from "@webiny/ui/Typography";
import { Alert } from "@webiny/ui/Alert";

const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/index");

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

const noPadding = css({
    padding: "5px !important"
});

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: () => void;
};

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({ open, onClose }) => {
    const { showSnackbar } = useSnackbar();
    const { data, setData } = useContentModelEditor();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            {
                <Form
                    onSubmit={async (index, form) => {
                        await setData(data => {
                            data.indexes.push(index);
                            return data;
                        });

                        onClose();
                        form.setState({ data: {} });
                        showSnackbar(
                            t`Index added. To apply the changes, please save the content model.`
                        );
                    }}
                >
                    {({ Bind, submit, data: formData }) => {
                        const selectedFields = get(formData, "fields", []);
                        const justIdSelected =
                            selectedFields.length === 1 && selectedFields[0] === "id";

                        let isExisting;
                        const hash = selectedFields.sort().join();
                        data.indexes.forEach(item => {
                            const itemHash = get(item, "fields", [])
                                .sort()
                                .join();
                            if (itemHash === hash) {
                                isExisting = true;
                                return false;
                            }
                        });

                        return (
                            <>
                                <DialogTitle>{t`Create index`}</DialogTitle>
                                <DialogContent>
                                    {isExisting && !justIdSelected && (
                                        <>
                                            <br />
                                            <Alert type="warning" title="Already existing">
                                                {t`An index with the same combination of fields already exists.`}
                                            </Alert>
                                        </>
                                    )}
                                    <Bind name="fields">
                                        <CheckboxGroup label={t`Choose fields`}>
                                            {({ onChange, getValue }) => (
                                                <>
                                                    <Grid className={noPadding}>
                                                        <Cell span={12}>
                                                            <Checkbox
                                                                value={getValue("id")}
                                                                onChange={onChange("id")}
                                                                label={
                                                                    <>
                                                                        <div>id</div>
                                                                    </>
                                                                }
                                                            />
                                                        </Cell>

                                                        {data.fields.map(
                                                            ({ label, fieldId, type }) => (
                                                                <Cell span={6} key={fieldId}>
                                                                    <Checkbox
                                                                        value={getValue(fieldId)}
                                                                        onChange={onChange(fieldId)}
                                                                        label={
                                                                            <>
                                                                                <div>
                                                                                    <I18NValue
                                                                                        value={
                                                                                            label
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                <div>
                                                                                    <Typography
                                                                                        use={
                                                                                            "caption"
                                                                                        }
                                                                                    >
                                                                                        {type}
                                                                                    </Typography>
                                                                                </div>
                                                                            </>
                                                                        }
                                                                    />
                                                                </Cell>
                                                            )
                                                        )}
                                                    </Grid>
                                                </>
                                            )}
                                        </CheckboxGroup>
                                    </Bind>
                                </DialogContent>
                                <DialogActions>
                                    <ButtonDefault
                                        disabled={justIdSelected || isExisting}
                                        onClick={submit}
                                    >
                                        + {t`Add index`}
                                    </ButtonDefault>
                                </DialogActions>
                            </>
                        );
                    }}
                </Form>
            }
        </Dialog>
    );
};

export default NewContentModelDialog;
