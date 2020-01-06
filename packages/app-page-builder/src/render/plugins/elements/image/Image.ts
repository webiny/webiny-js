// @flow
import React from "react";
import { get } from "lodash";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Image as WebinyImage } from "@webiny/app/components";

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

const Image = (props: Object) => {
    const { image = {}, link = {}, settings = {} } = get(props, "element.data", {});
    if (!image || !image.file) {
        return null;
    }

    const { width, height, title } = image;

    const { horizontalAlign = "center" } = settings;

    const style = { width, height };
    if (!style.width) {
        style.width = "100%";
    } else {
        style.width += style.width.endsWith("px") ? "" : "px";
    }

    if (!style.height) {
        style.height = "100%";
    } else {
        style.height += style.height.endsWith("px") ? "" : "px";
    }

    return (
        <ElementRoot
            element={props.element}
            style={{ textAlign: horizontalAlign }}
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-image"}
        >
            <Link link={link}>
                <WebinyImage
                    title={title}
                    alt={title}
                    style={style}
                    src={image.file.src}
                    srcSet="auto"
                />
            </Link>
        </ElementRoot>
    );
};

export default Image;
