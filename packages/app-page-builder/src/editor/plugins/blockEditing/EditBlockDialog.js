// @flow
import React from "react";
import { css } from "emotion";
import { getPlugins } from "@webiny/plugins";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogButton,
    DialogCancel
} from "@webiny/ui/Dialog";
import { validation } from "@webiny/validation";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import styled from "@emotion/styled";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

const PreviewBox = styled("div")({
    width: 500,
    minHeight: 250,
    border: "1px solid var(--mdc-theme-on-background)",
    backgroundColor: "#fff", // this must always be white
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    img: {
        maxHeight: 500,
        maxWidth: 500
    }
});

type Props = {
    open: boolean,
    plugin: ?Object,
    onClose: Function,
    onSubmit: Function
};

const EditBlockDialog = React.memo(
    (props: Props) => {
        const { open, onClose, onSubmit, plugin } = props;

        const blockCategoriesOptions = getPlugins("pb-editor-block-category").map(
            (item: Object) => ({
                value: item.name,
                label: item.title
            })
        );

        return (
            <Dialog open={open} onClose={onClose} className={narrowDialog}>
                {plugin && (
                    <Form onSubmit={onSubmit} data={plugin}>
                        {({ data, submit, Bind }) => (
                            <React.Fragment>
                                <DialogTitle>Update {plugin.title}</DialogTitle>
                                <DialogContent>
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"title"} validators={validation.create("required")}>
                                                <Input label={"Name"} autoFocus />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                    {data.type === "block" && (
                                        <>
                                            <Grid>
                                                <Cell span={12}>
                                                    <Bind name="category" validators={validation.create("required")}>
                                                        <Select
                                                            label="Category"
                                                            description="Select a block category"
                                                            options={blockCategoriesOptions}
                                                        />
                                                    </Bind>
                                                </Cell>
                                            </Grid>
                                        </>
                                    )}
                                    <Grid>
                                        <Cell span={12}>
                                            <PreviewBox>{plugin.preview()}</PreviewBox>
                                        </Cell>
                                    </Grid>
                                </DialogContent>
                                <DialogActions>
                                    <DialogCancel>Cancel</DialogCancel>
                                    <DialogButton onClick={submit}>Save</DialogButton>
                                </DialogActions>
                            </React.Fragment>
                        )}
                    </Form>
                )}
            </Dialog>
        );
    },
    (props, nextProps) => {
        return props.open === nextProps.open;
    }
);

export default EditBlockDialog;
