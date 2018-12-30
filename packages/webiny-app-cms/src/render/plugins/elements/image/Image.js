// @flow
import React from "react";
import { get } from "lodash";
import {
    ElementStyle,
    getElementStyleProps,
    getElementAttributeProps
} from "webiny-app-cms/render/components/ElementStyle";

const Link = ({ link, children }: Object) => {
    if (link && link.href) {
        return (
            <a href={link.href} target={link.newTab ? "_blank" : "_self"}>
                {children}
            </a>
        );
    }
    return children;
};

const Image = (props: *) => {
    const { src } = props.element.data;
    const { img = {}, link = {} } = get(props, "element.settings.advanced", {});
    const { width, height, align, rest } = img;
    const wrapperStyle = get(props, "element.settings.style", {});
    const elementStyles = getElementStyleProps(props.element);
    const elementAttributes = getElementAttributeProps(props.element);

    const style = { width, height };
    if (!style.width) {
        style.width = "100%";
    } else {
        style.width += "px";
    }

    if (!style.height) {
        style.height = "100%";
    } else {
        style.height += "px";
    }

    return (
        <ElementStyle {...elementStyles} {...elementAttributes}>
            <div
                className={"webiny-cms-base-element-style webiny-cms-element-image"}
                style={{ ...wrapperStyle, textAlign: align }}
            >
                <Link link={link}>
                    <img {...rest} style={style} src={src} />
                </Link>
            </div>
        </ElementStyle>
    );
};

export default Image;
