// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import { get } from "lodash";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import Input from "webiny-app-cms/editor/plugins/elementSettings/components/Input";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";

const ImageSettings = ({
    element,
    updateTitle,
    updateAlt,
    updateWidth,
    updateHeight,
    updateAlign
}: Object) => {
    const { image = {} } = get(element, "data", {});

    return (
        <Tabs>
            <Tab icon={<ImageIcon />} label="Image">
                <Input label="Title" value={image.title || ""} updateValue={updateTitle} inputWidth={"max-content"}/>
                <Input
                    label="Width"
                    placeholder="auto"
                    description="eg. 300 or 50%"
                    value={image.width || ""}
                    updateValue={updateWidth}
                    inputWidth={80}
                />
                <Input
                    label="Height"
                    placeholder="auto"
                    description="eg. 300 or 50%"
                    value={image.height || ""}
                    updateValue={updateHeight}
                    inputWidth={80}
                />
            </Tab>
        </Tabs>
    );
};

export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    ),
    withHandlers({
        updateData: ({ updateElement, element }) => {
            const historyUpdated = {};

            return (name, value, history = true) => {
                const attrKey = `data.image.${name}`;
                const newElement = set(element, attrKey, value);

                if (!history) {
                    updateElement({ element: newElement, history });
                    return;
                }

                if (historyUpdated[name] !== value) {
                    historyUpdated[name] = value;
                    updateElement({ element: newElement });
                }
            };
        }
    }),
    withHandlers({
        updateTitle: ({ updateData }) => (value: string) => updateData("title", value),
        updateAlt: ({ updateData }) => (value: string) => updateData("alt", value),
        updateWidth: ({ updateData }) => (value: string) => updateData("width", value),
        updateHeight: ({ updateData }) => (value: string) => updateData("height", value),
        updateAlign: ({ updateData }) => (value: string) => updateData("align", value)
    })
)(ImageSettings);
