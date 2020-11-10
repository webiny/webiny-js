import React from "react";
import { PbElement } from "@webiny/app-page-builder/types";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Image as WebinyImage } from "@webiny/app/components";
import { Link as RouterLink } from "@webiny/react-router";

const Link = ({ link, children }) => {
    if (link && link.href) {
        return (
            <RouterLink to={link.href} target={link.newTab ? "_blank" : "_self"}>
                {children}
            </RouterLink>
        );
    }
    return children;
};

type ImagePropsType = {
    element: PbElement;
};
const Image: React.FunctionComponent<ImagePropsType> = ({ element }) => {
    const { image = {}, link = {}, settings = {} } = element.data || {};
    if (!image || !image.file) {
        return null;
    }

    const { width, height, title } = image;

    const { horizontalAlign = "center" } = settings;

    const style = { width, height };
    if (!style.width) {
        style.width = "auto";
    } else {
        style.width += (style.width as string).endsWith("px") ? "" : "px";
    }

    if (!style.height) {
        style.height = "auto";
    } else {
        style.height += (style.height as string).endsWith("px") ? "" : "px";
    }

    return (
        <ElementRoot
            element={element}
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
