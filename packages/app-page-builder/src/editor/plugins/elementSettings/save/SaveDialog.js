// @flow
import React from "react";
import { css } from "emotion";
import { getPlugins } from "@webiny/plugins";
import ElementPreview from "./SaveDialog/ElementPreview";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogButton,
    DialogCancel
} from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";

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
    onClose: Function,
    onSubmit: Function,
    element: Object,
    type: string
};

const SaveDialog = React.memo(
    (props: Props) => {
        const { element, open, onClose, onSubmit, type } = props;

        const blockCategoriesOptions = getPlugins("pb-editor-block-category").map(
            (item: Object) => {
                return {
                    value: item.name,
                    label: item.title
                };
            }
        );

        return (
            <Dialog open={open} onClose={onClose} className={narrowDialog}>
                <Form
                    onSubmit={onSubmit}
                    data={{ type, category: "pb-editor-block-category-general" }}
                >
                    {({ data, submit, Bind }) => (
                        <React.Fragment>
                            <DialogTitle>Save {type}</DialogTitle>
                            <DialogContent>
                                {element.source && (
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name="overwrite">
                                                <Switch label="Update existing" />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                )}
                                {!data.overwrite && (
                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name={"name"} validators={"required"}>
                                                <Input label={"Name"} autoFocus />
                                            </Bind>
                                        </Cell>
                                    </Grid>
                                )}
                                {data.type === "block" && !data.overwrite && (
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
                                        <PreviewBox>
                                            <Bind name={"preview"}>
                                                {({ value, onChange }) =>
                                                    value ? (
                                                        <img src={value} alt={""} />
                                                    ) : open ? (
                                                        <ElementPreview
                                                            key={element.id}
                                                            onChange={onChange}
                                                            element={element}
                                                        />
                                                    ) : null
                                                }
                                            </Bind>
                                        </PreviewBox>
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
            </Dialog>
        );
    },
    (props, nextProps) => {
        return props.open === nextProps.open;
    }
);

export default SaveDialog;
