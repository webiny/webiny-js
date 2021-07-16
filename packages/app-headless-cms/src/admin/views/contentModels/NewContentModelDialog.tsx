import React, { useCallback } from "react";
import { css } from "emotion";
import get from "lodash/get";
import { useRouter } from "@webiny/react-router";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { CircularProgress } from "@webiny/ui/Progress";
import { validation } from "@webiny/validation";
import { useQuery, useMutation } from "../../hooks";
import { i18n } from "@webiny/app/i18n";
import { ButtonDefault } from "@webiny/ui/Button";
import * as UID from "@webiny/ui/Dialog";
import { Grid, Cell } from "@webiny/ui/Grid";
import { addModelToGroupCache, addModelToListCache } from "./cache";
import * as GQL from "../../viewsGraphql";

const t = i18n.ns("app-headless-cms/admin/views/content-models/new-content-model-dialog");

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
    onClose: UID.DialogOnClose;
};

const NewContentModelDialog: React.FC<NewContentModelDialogProps> = ({ open, onClose }) => {
    const [loading, setLoading] = React.useState(false);
    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const [createContentModel] = useMutation(GQL.CREATE_CONTENT_MODEL, {
        update(cache, { data }) {
            const { data: model, error } = data.createContentModel;

            if (error) {
                return showSnackbar(error.message);
            }

            addModelToListCache(cache, model);
            addModelToGroupCache(cache, model);

            history.push("/cms/content-models/" + model.modelId);
        }
    });

    const { data } = useQuery(GQL.LIST_MENU_CONTENT_GROUPS_MODELS, {
        skip: !open
    });

    const contentModelGroups = get(data, "listContentModelGroups.data", []).map(item => {
        return { value: item.id, label: item.name };
    });

    const nameValidator = useCallback(name => {
        if (!name.charAt(0).match(/[a-zA-Z]/)) {
            throw new Error("Value is not valid - must not start with a number.");
        }
        if (name.trim().toLowerCase() === "id") {
            throw new Error('Value is not valid - "id" is an auto-generated field.');
        }
        return true;
    }, undefined);

    return (
        <UID.Dialog
            open={open}
            onClose={onClose}
            className={narrowDialog}
            data-testid="cms-new-content-model-modal"
        >
            {open && (
                <Form
                    data={{
                        group: get(contentModelGroups, "0.value")
                    }}
                    onSubmit={async data => {
                        setLoading(true);
                        await createContentModel({
                            variables: { data }
                        });
                    }}
                >
                    {({ Bind, submit }) => (
                        <>
                            {loading && <CircularProgress />}
                            <UID.DialogTitle>{t`New Content Model`}</UID.DialogTitle>
                            <UID.DialogContent>
                                <Grid className={noPadding}>
                                    <Cell span={12}>
                                        <Bind
                                            name={"name"}
                                            validators={[
                                                validation.create("required,maxLength:100"),
                                                nameValidator
                                            ]}
                                        >
                                            <Input
                                                label={t`Name`}
                                                description={t`The name of the content model`}
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name={"group"}
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                description={t`Choose a content model group`}
                                                label={t`Content model group`}
                                                options={contentModelGroups}
                                            />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="description">
                                            {props => (
                                                <Input
                                                    {...props}
                                                    rows={4}
                                                    maxLength={200}
                                                    characterCount
                                                    label={t`Description`}
                                                />
                                            )}
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </UID.DialogContent>
                            <UID.DialogActions>
                                <ButtonDefault onClick={submit}>+ {t`Create`}</ButtonDefault>
                            </UID.DialogActions>
                        </>
                    )}
                </Form>
            )}
        </UID.Dialog>
    );
};

export default NewContentModelDialog;
