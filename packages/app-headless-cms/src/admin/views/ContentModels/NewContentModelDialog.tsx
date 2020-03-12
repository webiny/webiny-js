import React from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Mutation } from "react-apollo";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { CREATE_CONTENT_MODEL } from "../../viewsGraphql";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { Grid, Cell } from "@webiny/ui/Grid";

import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { ButtonDefault } from "@webiny/ui/Button";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: DialogOnClose;
    contentModelsDataList: any;
};

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    contentModelsDataList
}) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            <Mutation mutation={CREATE_CONTENT_MODEL}>
                {update => (
                    <Form
                        onSubmit={async data => {
                            setLoading(true);
                            const response = get(
                                await update({
                                    variables: { data },
                                    refetchQueries: ["HeadlessCmsListContentModels"], // TODO @i18n: Proper refetch here!
                                    awaitRefetchQueries: true
                                }),
                                "data.cmsManage.createContentModel"
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
                                <DialogTitle>{t`New Content Model`}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"title"}>
                                                <Input
                                                    placeholder={
                                                        "Enter a name for your new content model"
                                                    }
                                                />
                                            </Bind>
                                        </Cell>
                                        <Cell span={12}>
                                            <Bind name={"modelId"}>
                                                <Input placeholder={"Enter a model ID"} />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>
                                    <ButtonDefault onClick={submit}>+ {t`Create`}</ButtonDefault>
                                </DialogActions>
                            </>
                        )}
                    </Form>
                )}
            </Mutation>
        </Dialog>
    );
};

export default NewContentModelDialog;
