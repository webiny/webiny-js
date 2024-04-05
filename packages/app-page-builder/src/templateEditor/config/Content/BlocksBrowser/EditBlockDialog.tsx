import React from "react";
import { plugins } from "@webiny/plugins";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogCancel,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { CircularProgress } from "@webiny/ui/Progress";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form, FormOnSubmit } from "@webiny/form";
import styled from "@emotion/styled";
import { ButtonPrimary } from "@webiny/ui/Button";
import { PbEditorBlockCategoryPlugin, PbEditorBlockPlugin } from "~/types";

const StyledDialog = styled(Dialog)`
    // We need to have this z-index because without it Edit Block Dialog will be rendered below All Blocks Component.
    z-index: 100;

    & .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

interface EditBlockDialogProps {
    open: boolean;
    plugin: PbEditorBlockPlugin | null;
    onClose: DialogOnClose;
    onSubmit: FormOnSubmit;
    loading: boolean;
}

const EditBlockDialog = (props: EditBlockDialogProps) => {
    const { open, onClose, onSubmit, plugin, loading } = props;

    const blockCategoryPlugins = plugins.byType<PbEditorBlockCategoryPlugin>(
        "pb-editor-block-category"
    );
    const blockCategoriesOptions = blockCategoryPlugins.map(item => ({
        value: item.categoryName,
        label: item.title
    }));

    return (
        <StyledDialog open={open} onClose={onClose}>
            {loading && <CircularProgress label={"Saving block..."} />}
            {plugin && (
                <Form onSubmit={onSubmit} data={plugin}>
                    {({ submit, Bind }) => (
                        <React.Fragment>
                            <DialogTitle>Update {plugin.title}</DialogTitle>
                            <DialogContent>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name={"title"}
                                            validators={validation.create("required")}
                                        >
                                            <Input label={"Name"} autoFocus />
                                        </Bind>
                                    </Cell>
                                </Grid>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind
                                            name="blockCategory"
                                            validators={validation.create("required")}
                                        >
                                            <Select
                                                label="Category"
                                                description="Select a block category"
                                                options={blockCategoriesOptions}
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <DialogCancel>Cancel</DialogCancel>
                                <ButtonPrimary onClick={submit}>Save</ButtonPrimary>
                            </DialogActions>
                        </React.Fragment>
                    )}
                </Form>
            )}
        </StyledDialog>
    );
};

const MemoizedEditBlockDialog = React.memo(
    EditBlockDialog,
    (props: EditBlockDialogProps, nextProps: EditBlockDialogProps) => {
        return props.open === nextProps.open && props.loading === nextProps.loading;
    }
);

MemoizedEditBlockDialog.displayName = "MemoizedEditBlockDialog";
export default MemoizedEditBlockDialog;
