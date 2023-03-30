import React from "react";
import { PbElement } from "../../../../types";
import { ElementRoot } from "../../../components/ElementRoot";
import { Image as WebinyImage } from "@webiny/app/components";
import { Link as RouterLink } from "@webiny/react-router";

type LinkPropsType = {
    link?: {
        href?: string;
        newTab?: boolean;
    };
    children: React.ReactElement;
};
const Link: React.VFC<LinkPropsType> = ({ link, children }) => {
    if (!link || !link.href) {
        return children;
    }
    return (
        <RouterLink to={link.href} target={link.newTab ? "_blank" : "_self"}>
            {children}
        </RouterLink>
    );
};

interface ImagePropsType {
    element: PbElement;
}
const Image: React.VFC<ImagePropsType> = ({ element }) => {
    const { image = {}, link = {} } = element.data || {};
    if (!image || !image.file) {
        return null;
    }

    const { width, height, title } = image;

    const style = { width, height };

    return (
        <ElementRoot
            element={element}
            style={{ display: "flex" }}
            className={"webiny-pb-base-page-element-style webiny-pb-page-element-image"}
        >
            <Link link={link}>
                <WebinyImage
                    title={title}
                    alt={title}
                    style={style}
                    src={image.file.src || ""}
                    srcSet="auto"
                />
            </Link>
        </ElementRoot>
    );
};

export default Image;
