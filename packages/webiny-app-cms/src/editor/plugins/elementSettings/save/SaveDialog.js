// @flow
import React from "react";
import { css } from "emotion";
import { pure } from "recompose";
import domtoimage from "dom-to-image";
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
import { SingleImageUpload } from "webiny-ui/ImageUpload";
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
    id: string,
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object,
    type: string
};

const SaveDialog = pure(({ id, open, onClose, onSubmit, type }: Props) => {
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form onSubmit={onSubmit} data={{ type }}>
                {({ data, submit, Bind }) => (
                    <React.Fragment>
                        <DialogHeader>
                            <DialogHeaderTitle>Save {type}</DialogHeaderTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Grid>
                                <Cell span={12}>
                                    <Bind name={"name"} validators={"required"}>
                                        <Input label={"Name"} autoFocus />
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
                            <Bind name={"preview"}>
                                {({ value, onChange }) =>
                                    value ? (
                                        <SingleImageUpload value={value} onChange={onChange} />
                                    ) : (
                                        <ElementPreview key={id} onChange={onChange} id={id} />
                                    )
                                }
                            </Bind>
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

class ElementPreview extends React.Component<*> {
    componentDidMount() {
        this.generateImage();
    }

    componentDidUpdate() {
        this.generateImage();
    }

    generateImage() {
        setTimeout(async () => {
            const node = document.querySelector(`#${this.props.id} element-content`).firstChild;
            const dataUrl = await domtoimage.toPng(node);
            this.props.onChange({ src: dataUrl });
        }, 200);
    }

    render() {
        return null;
    }
}

export default SaveDialog;
