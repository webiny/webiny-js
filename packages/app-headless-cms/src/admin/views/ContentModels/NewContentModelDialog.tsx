import React from "react";
import { css } from "emotion";
import useReactRouter from "use-react-router";
import { Mutation, useQuery } from "react-apollo";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { CREATE_CONTENT_MODEL } from "../../viewsGraphql";
import get from "lodash.get";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { LIST_CONTENT_MODEL_GROUPS } from "../ContentModelGroups/graphql";

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

    const { data } = useQuery(LIST_CONTENT_MODEL_GROUPS);

    const selectOptions = get(data, "cmsManage.contentModelGroups.data", []).map(item => {
        return { value: item.id, label: item.name };
    });

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
                                    awaitRefetchQueries: true,
                                    refetchQueries: [
                                        "HeadlessCmsListContentModels",
                                        "HeadlessCmsListMenuContentGroupsModels"
                                    ]
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
                                    <Bind name={"title"} validators={validation.create("required")}>
                                        <Input
                                            disabled={true}
                                            placeholder={"Enter a name for your new content model"}
                                        />
                                    </Bind>
                                    <Bind
                                        name={"modelId"}
                                        validators={validation.create("required")}
                                    >
                                        <Input placeholder={t`Enter a model ID`} />
                                    </Bind>
                                    <Bind name={"group"} validators={validation.create("required")}>
                                        <Select
                                            label={t`Content model group`}
                                            options={selectOptions}
                                        />
                                    </Bind>
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
