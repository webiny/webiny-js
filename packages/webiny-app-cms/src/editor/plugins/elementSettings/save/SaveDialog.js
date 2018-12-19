// @flow
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compose, shouldUpdate } from "recompose";
import { css } from "emotion";
import { getPlugin, getPlugins } from "webiny-plugins";
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
import { Select } from "webiny-ui/Select";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";
import styled from "react-emotion";

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
    backgroundColor: "var(--mdc-theme-surface)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
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

            this.props.onChange(dataUrl);
        }, 200);
    }

    render() {
        return null;
    }
}

type Props = {
    open: boolean,
    onClose: Function,
    onSubmit: Function,
    element: Object,
    type: string
};

const SaveDialog = (props: Props) => {
    const { element, open, onClose, onSubmit, type } = props;

    const blockCategoriesOptions = getPlugins("cms-block-category").map((item: Object) => {
        return {
            value: item.name,
            label: item.title
        };
    });

    return (
        <Dialog open={open} onClose={onClose} className={narrowDialog}>
            <Form onSubmit={onSubmit} data={{ type, category: "cms-block-category-general" }}>
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
                                <>
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

                                    <Grid>
                                        <Cell span={12}>
                                            <Bind name="category" validators={["required"]}>
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
                        </DialogBody>
                        <DialogFooter>
                            <DialogCancel>Cancel</DialogCancel>
                            <DialogFooterButton onClick={submit}>Save</DialogFooterButton>
                        </DialogFooter>
                    </React.Fragment>
                )}
            </Form>
        </Dialog>
    );
};

export default compose(
    shouldUpdate((props, nextProps) => {
        return props.open !== nextProps.open;
    })
)(SaveDialog);
