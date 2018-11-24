// @flow
import React from "react";
import { css } from "emotion";
import { compose, withState } from "recompose";
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
import { Tags } from "webiny-ui/Tags";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";
import { ImageEditor } from "webiny-ui/ImageEditor";

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

const SaveDialog = ({ id, open, onClose, onSubmit, type, imageEditor, showImageEditor }: Props) => {
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
                                        <>
                                            {imageEditor ? (
                                                <ImageEditor src={value.src}>
                                                    {({
                                                        render,
                                                        getCanvasDataUrl,
                                                        activeTool,
                                                        applyActiveTool
                                                    }) => (
                                                        <>
                                                            {render()}
                                                            <DialogFooter>
                                                                <button
                                                                    onClick={() =>
                                                                        showImageEditor(false)
                                                                    }
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        activeTool &&
                                                                            (await applyActiveTool());
                                                                        await onChange({
                                                                            src: getCanvasDataUrl()
                                                                        });
                                                                        showImageEditor(false);
                                                                    }}
                                                                >
                                                                    Save
                                                                </button>
                                                            </DialogFooter>
                                                        </>
                                                    )}
                                                </ImageEditor>
                                            ) : (
                                                <>
                                                    <img src={value.src} />
                                                    <button onClick={() => showImageEditor(true)}>
                                                        Edit
                                                    </button>
                                                </>
                                            )}
                                        </>
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
};

export default compose(withState("imageEditor", "showImageEditor", false))(SaveDialog);
