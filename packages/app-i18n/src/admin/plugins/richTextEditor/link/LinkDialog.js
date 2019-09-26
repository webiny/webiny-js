import React, { Fragment } from "react";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { Form } from "@webiny/form";
import { Input } from "@webiny/ui/Input";
import { Switch } from "@webiny/ui/Switch";
import { Cell, Grid } from "@webiny/ui/Grid";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogCancel,
    DialogActions,
    DialogButton
} from "@webiny/ui/Dialog";
import { getLinkRange, isLink, TYPE } from "./utils";
import { validation } from "@webiny/validation";

const LinkDialog = props => {
    const { open, closeDialog, activePlugin } = props;

    let linkData = null;
    if (activePlugin) {
        let { selection, inlines, anchorText } = activePlugin.value;
        let link = inlines.find(isLink);

        if (typeof anchorText !== "string") {
            anchorText = anchorText.getText();
        }

        const selectedText = link
            ? anchorText
            : anchorText.substr(
                  selection.anchor.offset,
                  selection.focus.offset - selection.anchor.offset
              );

        linkData = { ...(link && link.data), text: selectedText };
    }

    const updateLink = useHandler(
        props,
        ({ editor, onChange, closeDialog, activePlugin }) => ({ text, ...data }) => {
            editor.change(change => {
                const { selection } = activePlugin.value;
                const linkSelection = getLinkRange(change, selection);
                change
                    .select(linkSelection)
                    .unwrapInline(TYPE)
                    .insertText(text)
                    .moveAnchorBackward(text.length)
                    .wrapInline({ type: TYPE, data })
                    .moveToEnd();

                onChange(change);
                closeDialog();
            });
        }
    );

    return (
        <Dialog open={open} onClose={closeDialog} style={{ zIndex: 11000 }}>
            <Form data={linkData} onSubmit={updateLink}>
                {({ Bind, submit }) => (
                    <Fragment>
                        <DialogTitle>Edit Link</DialogTitle>
                        <DialogContent>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name={"text"} validators={validation.create("required")}>
                                        <Input label="Text to display" />
                                    </Bind>
                                </Cell>
                                <Cell span={12}>
                                    <Bind name={"href"} validators={validation.create("required,url")}>
                                        <Input label="URL" />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name={"newTab"}>
                                        <Switch
                                            onChange={() => submit()}
                                            label={"Open in new window"}
                                        />
                                    </Bind>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name={"noFollow"}>
                                        <Switch
                                            onChange={() => submit()}
                                            label={`Add "rel=nofollow"`}
                                        />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel onClick={closeDialog}>Cancel</DialogCancel>
                            <DialogButton onClick={submit}>OK</DialogButton>
                        </DialogActions>
                    </Fragment>
                )}
            </Form>
        </Dialog>
    );
};

export default LinkDialog;
