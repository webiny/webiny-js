// @flow
import React, { useMemo, useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { set } from "dot-prop-immutable";
import { get } from "lodash";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import { ReactComponent as ImageIcon } from "./round-image-24px.svg";

const ImageSettings = ({ element, updateElement }: Object) => {
    const { image = {} } = get(element, "data", {});

    const setData = useMemo(() => {
        const historyUpdated = {};

        return (name, value) => {
            const attrKey = `data.image.${name}`;
            const newElement = set(element, attrKey, value);

            if (historyUpdated[name] !== value) {
                historyUpdated[name] = value;
                updateElement({ element: newElement });
            }
        };
    }, [element, updateElement]);

    const updateTitle = useCallback(value => setData("title", value), [setData]);
    const updateWidth = useCallback(value => setData("width", value), [setData]);
    const updateHeight = useCallback(value => setData("height", value), [setData]);

    return (
        <Tabs>
            <Tab icon={<ImageIcon />} label="Image">
                <Input
                    label="Title"
                    value={image.title || ""}
                    updateValue={updateTitle}
                    inputWidth={"max-content"}
                />
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

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(ImageSettings);
