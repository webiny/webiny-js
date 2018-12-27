// @flow
import React from "react";
import { get } from "lodash";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";

const Image = (props: *) => {
    const { src } = props.element.data;
    const { width, height, align, rest } = get(props, "element.settings.advanced.img", {});
    const wrapperStyle = get(props, "element.settings.style", {});

    const elementStyles = getElementStyleProps(props.element);
    const elementAttributes = getElementAttributeProps(props.element);

    const style = { width, height };
    if (!style.width && !style.height) {
        style.width = "100%";
        style.height = "100%";
    }

    return (
        <ElementStyle {...elementStyles} {...elementAttributes}>
            <div
                className={"webiny-cms-base-element-style webiny-cms-element-image"}
                style={{ ...wrapperStyle, textAlign: align }}
            >
                <img {...rest} style={style} src={src} />
            </div>
        </ElementStyle>
    );
};

export default Image;
