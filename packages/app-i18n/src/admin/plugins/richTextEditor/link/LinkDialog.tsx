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
import { validation } from "@webiny/validation";
import { Editor, Transforms, Range } from "slate";

const LinkDialog = props => {
    const { editor, open, closeDialog, activePlugin } = props;

    if (activePlugin) {
        Transforms.select(editor, activePlugin.selection);
    }

    let linkData = null;

    if (activePlugin) {
        const [item] = Editor.nodes(editor, { match: n => n.type === "link" });
        const link = Array.isArray(item) ? item[0] : null;
        let selectedText = "";

        if (link) {
            selectedText = link.children[0].children[0].text;
        } else {
            const [fragment] = activePlugin.fragment;
            selectedText = fragment ? fragment.children[0].text : "";
        }

        linkData = { ...link, text: selectedText };
    }

    const updateLink = useHandler(
        props,
        ({ closeDialog, activePlugin, editor }) => ({ text, ...data }) => {
            const { selection } = activePlugin;
            const isCollapsed = selection && Range.isCollapsed(selection);
            const link = {
                type: "link",
                ...data,
                children: isCollapsed ? [{ text }] : []
            };

            Transforms.select(editor, selection);
            console.log("selection", editor.selection);

            if (isCollapsed) {
                Transforms.insertNodes(editor, link);
            } else {
                Transforms.wrapNodes(editor, link, { split: true, at: selection });
                Transforms.collapse(editor, { edge: "end" });
            }
            closeDialog();
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
                                    <Bind
                                        name={"href"}
                                        validators={validation.create("required,url:allowRelative")}
                                    >
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
