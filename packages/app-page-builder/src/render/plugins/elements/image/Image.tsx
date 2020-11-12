import React from "react";
import { get } from "lodash";
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

const position = { left: "flex-start", center: "center", right: "flex-end" };

const Image = props => {
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
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-image"}
            // alignItems: position[horizontalAlign] is here because of a Safari CSS bug when flex is enabled on an image
            // container with height is set to auto and the width is configured
            style={{ display: "flex", alignItems: position[horizontalAlign], justifyContent: position[horizontalAlign] }}
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
