// @flow
import * as React from "react";
import { Link } from "react-router-dom";
import _ from "lodash";

const allowedProps = [
    "className",
    "style",
    "target",
    "href",
    "onClick",
    "title",
    "tabIndex",
    "disabled"
];

const utils = {
    getLink(route: string, LinkComponent: typeof Link, linkProps: Object = {}) {
        if (!linkProps.children) {
            linkProps.children = linkProps.label;
        }

        if (!route) {
            const finalProps = {};
            _.each(linkProps, (value, prop) => {
                if (allowedProps.includes(prop) || prop.startsWith("data-")) {
                    finalProps[prop] = value;
                }
            });

            return <a {...finalProps}>{linkProps.children}</a>;
        }

        return <LinkComponent to={route} {...linkProps} />;
    }
};

export default utils;
