import React, { useRef } from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Form } from "@webiny/form";
import { CREATE_INDEX } from "./graphql";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CheckboxGroup, Checkbox } from "@webiny/ui/Checkbox";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { I18NValue } from "@webiny/app-i18n/components";
import { Typography } from "@webiny/ui/Typography";

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
    onClose: DialogOnClose;
};

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();
    const formRef = useRef<any>();
    const { data } = useContentModelEditor();

    const [createContentModel] = useMutation(CREATE_INDEX);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            <Form
                ref={formRef}
                onSubmit={async data => {
                    setLoading(true);
                    const response = get(
                        await createContentModel({
                            variables: { data },
                            awaitRefetchQueries: true
                        }),
                        "data.createContentModel"
                    );

                    if (response.error) {
                        setLoading(false);
                        return showSnackbar(response.error.message);
                    }

                    await contentModelsDataList.refresh();
                    history.push("/cms/content-models/" + response.data.id);
                }}
            >
                {({ Bind, submit }) => (
                    <>
                        {loading && <CircularProgress />}
                        <DialogTitle>{t`Create index`}</DialogTitle>
                        <DialogContent>
                            <Bind name="fruits">
                                <CheckboxGroup label={t`Choose fields`}>
                                    {({ onChange, getValue }) => (
                                        <>
                                            <Grid className={noPadding}>
                                                {data.fields.map(({ label, fieldId }) => (
                                                    <Cell span={6} key={fieldId}>
                                                        <Checkbox
                                                            label={<I18NValue value={label} />}
                                                            value={getValue(fieldId)}
                                                            onChange={onChange(fieldId)}
                                                        />
                                                    </Cell>
                                                ))}
                                            </Grid>
                                        </>
                                    )}
                                </CheckboxGroup>
                            </Bind>
                        </DialogContent>
                        <DialogActions>
                            <ButtonDefault onClick={submit}>+ {t`Create`}</ButtonDefault>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default NewContentModelDialog;
