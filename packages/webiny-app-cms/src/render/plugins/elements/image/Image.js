// @flow
import React from "react";
import { get } from "lodash";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";

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
    const { image = {}, link = {} } = get(props, "element.data", {});
    const { width, height, align, rest, src } = image;

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
        <ElementRoot element={props.element} style={{ textAlign: align }}>
            <div className={"webiny-cms-base-element-style webiny-cms-element-image"}>
                <Link link={link}>
                    <img {...rest} style={style} src={src} />
                </Link>
            </div>
        </ElementRoot>
    );
};

export default Image;
