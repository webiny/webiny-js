// @flow
import React from "react";
import { css } from "emotion";
import { compose, withProps, pure } from "recompose";
import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogAccept,
    DialogCancel
} from "webiny-ui/Dialog";
import { Input } from "webiny-ui/Input";
import { Tags } from "webiny-ui/Tags";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";

const narrowDialog = css({
    ".mdc-dialog__surface": {
        width: 600,
        minWidth: 600
    }
});

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object
};

const removeIdsAndPaths = el => {
    delete el.id;
    delete el.path;

    el.elements.forEach(el => {
        delete el.id;
        delete el.path;
        if (el.elements.length) {
            removeIdsAndPaths(el);
        }
    });
};

const SaveDialog = pure(({ open, onClose, onSubmit, element }: Props) => {
    const type = element.type === "cms-element-block" ? "block" : "element";
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form
                onSubmit={data => {
                    removeIdsAndPaths(data.content);
                    onSubmit(data);
                }}
                data={{
                    type,
                    content: element
                }}
            >
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Save {type}</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name={"name"} validators={"required"}>
                                        <Input label={"Name"} />
                                    </Bind>
                                </Cell>
                            </Grid>
                            {data.type === "block" && (
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name="keywords">
                                            <Tags
                                                label="Keywords"
                                                description="Enter search keywords"
                                            />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            )}
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogAccept onClick={submit}>Save</DialogAccept>
                        </DialogFooter>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
});

export default SaveDialog;
