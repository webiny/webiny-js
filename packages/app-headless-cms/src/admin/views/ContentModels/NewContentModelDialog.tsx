import React from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { CREATE_CONTENT_MODEL } from "../../viewsGraphql";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { LIST_CONTENT_MODEL_GROUPS } from "../ContentModelGroups/graphql";
import { useQuery, useMutation } from "@webiny/app-headless-cms/admin/hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import slugify from "slugify";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";

const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 400,
        minWidth: 400
    }
});

const noPadding = css({
    padding: "5px !important"
});

export type NewContentModelDialogProps = {
    open: boolean;
    onClose: DialogOnClose;
    contentModelsDataList: any;
};

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({
    open,
    onClose,
    contentModelsDataList
}) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    const { data } = useQuery(LIST_CONTENT_MODEL_GROUPS);
    const [update] = useMutation(CREATE_CONTENT_MODEL);

    const selectOptions = get(data, "contentModelGroups.data", []).map(item => {
        return { value: item.id, label: item.name };
    });

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            <Form
                onSubmit={async data => {
                    setLoading(true);
                    const response = get(
                        await update({
                            variables: { data },
                            awaitRefetchQueries: true,
                            refetchQueries: [
                                "HeadlessCmsListContentModels",
                                "HeadlessCmsListMenuContentGroupsModels"
                            ]
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
                {({ Bind, submit, setValue }) => (
                    <>
                        {loading && <CircularProgress />}
                        <DialogTitle>{t`New Content Model`}</DialogTitle>
                        <DialogContent>
                            <Grid className={noPadding}>
                                <Cell span={12}>
                                    <Bind
                                        name={"title"}
                                        validators={validation.create("required")}
                                        afterChange={value => {
                                            setValue("modelId", toSlug(value));
                                        }}
                                    >
                                        <Input
                                            label={`Name`}
                                            description={t`It will appear in the editor`}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind
                                        name={"modelId"}
                                        validators={validation.create("required")}
                                    >
                                        <Input
                                            label={`Model ID`}
                                            description={t`Generated from name`}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"group"} validators={validation.create("required")}>
                                        <Select
                                            label={t`Content model group`}
                                            options={selectOptions}
                                        />
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
        </Dialog>
    );
};

export default NewContentModelDialog;
