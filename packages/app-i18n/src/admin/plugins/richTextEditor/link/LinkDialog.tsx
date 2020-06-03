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
import { ReactEditor } from "slate-react";

const getLink = editor => {
    const [item] = Editor.nodes(editor, { match: n => n.type === "link" });
    return item;
};

const createLink = (data, children) => {
    return {
        type: "link",
        ...data,
        children
    };
};

export const LinkDialog = props => {
    const { editor, open, closeDialog, activePlugin } = props;

    let linkData = null;

    if (activePlugin) {
        Transforms.select(editor, activePlugin.selection);
        const item = getLink(editor);
        const [link, path] = Array.isArray(item) ? [item[0], item[1]] : [null, null];
        let selectedText = "";

        if (link) {
            activePlugin.selection = {
                anchor: Editor.start(editor, path),
                focus: Editor.end(editor, path)
            };
        }

        if (link) {
            selectedText = link.children[0].text;
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
            Transforms.select(editor, selection);
            const isCollapsed = selection && Range.isCollapsed(selection);

            const existingLink = getLink(editor);
            if (existingLink) {
                const path = ReactEditor.findPath(editor, existingLink[0]);
                Transforms.setNodes(editor, createLink(data, [{ text }]), { at: path });
                Transforms.insertText(editor, text, { at: path });
            } else if (isCollapsed) {
                Transforms.insertNodes(editor, createLink(data, [{ text }]));
            } else {
                Transforms.wrapNodes(editor, createLink(data, []), { split: true, at: selection });
                Transforms.collapse(editor, { edge: "end" });
            }

            Transforms.deselect(editor);

            closeDialog();
        }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { children, type, ...formData } = linkData || {};

    return (
        <Dialog open={open} onClose={closeDialog} style={{ zIndex: 11000 }}>
            <Form data={formData} onSubmit={updateLink}>
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
