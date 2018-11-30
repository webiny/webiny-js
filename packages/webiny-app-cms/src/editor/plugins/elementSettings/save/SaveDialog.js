// @flow
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compose, withState, shouldUpdate } from "recompose";
import { css } from "emotion";
import { getPlugin } from "webiny-plugins";
import domToImage from "./domToImage";
import {
    Dialog,
    DialogHeader,
    DialogHeaderTitle,
    DialogBody,
    DialogFooter,
    DialogFooterButton,
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

class ElementPreview extends React.Component<*> {
    componentDidMount() {
        this.generateImage();
    }

    componentDidUpdate() {
        this.generateImage();
    }

    replaceContent(element: Object, doc: Document) {
        const pl = getPlugin(element.type);
        if (!pl) {
            return doc;
        }

        if (typeof pl.renderElementPreview === "function") {
            const elementNode: any = document.getElementById(element.id);

            if (!elementNode) {
                return doc;
            }

            const newContentString = renderToStaticMarkup(
                pl.renderElementPreview({
                    element,
                    width: elementNode.offsetWidth || 0,
                    height: elementNode.offsetHeight || 0
                })
            );

            const wrapper = document.createElement("div");
            wrapper.innerHTML = newContentString;

            const newContentDoc: any = wrapper.firstChild;

            // $FlowFixMe
            doc.querySelector("#" + element.id).replaceWith(newContentDoc);
        }

        if (element.elements.length) {
            element.elements.forEach(el => {
                doc = this.replaceContent(el, doc);
            });
        }

        return doc;
    }

    generateImage() {
        const { element } = this.props;
        setTimeout(async () => {
            const node = document.getElementById(element.id);
            if (!node) {
                return null;
            }

            node.classList.add("no-highlight");
            const typeNode = node.querySelector(".type");
            let typeDisplay = "none";
            if (typeNode) {
                typeDisplay = typeNode.style.display;
                typeNode.style.display = "none";
            }

            const dataUrl = await domToImage.toPng(node, {
                onDocument: doc => this.replaceContent(element, doc),
                width: 500
            });

            node.classList.remove("no-highlight");
            if (typeNode) {
                typeNode.style.display = typeDisplay;
            }

            this.props.onChange({ src: dataUrl });
        }, 200);
    }

    render() {
        return null;
    }
}

type Props = {
    id: string,
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object,
    type: string,
    image: ?Object,
    setImage?: Function
};

const SaveDialog = (props: Props) => {
    const { element, open, onClose, onSubmit, type, image, setImage } = props;
    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <ImageEditor src={image ? image.src : ""}>
                {({ render: renderImageEditor, getCanvasDataUrl }) => (
                    <Form
                        onSubmit={data => {
                            data.preview = { src: getCanvasDataUrl() };
                            onSubmit(data);
                        }}
                        data={{ type }}
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
                                    <Grid>
                                        <Cell span={12}>
                                            {image ? (
                                                renderImageEditor()
                                            ) : open ? (
                                                <ElementPreview
                                                    key={element.id}
                                                    onChange={setImage}
                                                    element={element}
                                                />
                                            ) : null}
                                        </Cell>
                                    </Grid>
                                </DialogBody>
                                <DialogFooter>
                                    <DialogCancel>Cancel</DialogCancel>
                                    <DialogFooterButton onClick={submit}>Save</DialogFooterButton>
                                </DialogFooter>
                            </React.Fragment>
                        )}
                    </Form>
                )}
            </ImageEditor>
        </Dialog>
    );
};

export default compose(
    shouldUpdate((props, nextProps) => {
        return props.open !== nextProps.open;
    }),
    withState("image", "setImage", null)
)(SaveDialog);
