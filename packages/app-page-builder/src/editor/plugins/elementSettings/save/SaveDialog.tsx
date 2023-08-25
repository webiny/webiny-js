import React, { useState, useEffect } from "react";
import { css } from "emotion";
import { plugins } from "@webiny/plugins";
import ElementPreview from "./SaveDialog/ElementPreview";
import { CircularProgress } from "@webiny/ui/Progress";
import { PageElementsProvider } from "~/contexts/PageBuilder/PageElementsProvider";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogButton,
    DialogCancel,
    DialogOnClose
} from "@webiny/ui/Dialog";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Select } from "@webiny/ui/Select";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form, FormOnSubmit } from "@webiny/form";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { PbEditorBlockCategoryPlugin, PbEditorElement, PbElement } from "~/types";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

const PreviewBox = styled("div")({
    width: "100%",
    padding: "25px",
    boxSizing: "border-box",
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

interface Props {
    open: boolean;
    onClose: DialogOnClose;
    onSubmit: FormOnSubmit;
    element: PbEditorElement;
    type: string;
}

const SaveDialog = (props: Props) => {
    const { element, open, onClose, type } = props;
    const [loading, setLoading] = useState(false);

    const [pbElement, setPbElement] = useState<PbElement>();
    const { getElementTree } = useEventActionHandler();

    useEffect(() => {
        setTimeout(async () => {
            setPbElement((await getElementTree({ element })) as PbElement);
        });
    }, []);

    const blockCategoriesOptions = plugins
        .byType<PbEditorBlockCategoryPlugin>("pb-editor-block-category")
        .map(item => {
            return {
                value: item.categoryName,
                label: item.title
            };
        });

    const onSubmit: FormOnSubmit = async (data, form) => {
        setLoading(true);
        await props.onSubmit(data, form);
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form onSubmit={onSubmit} data={{ type, category: "general", id: element.id }}>
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        <DialogTitle>Save {type}</DialogTitle>
                        <DialogContent>
                            {loading && <CircularProgress label={`Saving ${type}...`} />}

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
                                        <Bind
                                            name={"name"}
                                            validators={validation.create("required")}
                                        >
                                            <Input label={"Name"} autoFocus />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            )}
                            {data.type === "block" && !data.overwrite && (
                                <>
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
                                </>
                            )}
                            <Grid>
                                <Cell span={12}>
                                    <PreviewBox>
                                        <PageElementsProvider>
                                            <ElementPreview element={pbElement} />
                                        </PageElementsProvider>
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
};

const MemoizedSaveDialog = React.memo(SaveDialog, (props, nextProps) => {
    return props.open === nextProps.open;
});

MemoizedSaveDialog.displayName = "MemoizedSaveDialog";
export default MemoizedSaveDialog;
