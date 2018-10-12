// @flow
import * as React from "react";
import each from "lodash/each";
import { router } from ".";

type Props = {
    children: React.Node,
    disabled?: boolean,
    url?: ?string,
    title?: ?string,
    route?: ?string,
    params?: Object,
    className?: ?string,
    tabIndex?: ?number,
    onClick?: ?Function
};

class Link extends React.Component<Props> {
    static defaultProps = {
        disabled: false,
        url: null,
        title: null,
        route: null,
        params: {},
        className: null,
        tabIndex: null,
        onClick: null
    };

    allowedProps = [
        "className",
        "style",
        "target",
        "href",
        "onClick",
        "title",
        "tabIndex",
        "disabled"
    ];

    getLinkProps = (): Object => {
        const props: Props & { href?: ?string } = { ...this.props };

        props.href = null;

        if (!props.disabled) {
            if (props.url) {
                const url: string = props.url;
                // Let's ensure we have at least http:// specified - for cases where users just type www...
                if (!/^(f|ht)tps?:\/\//i.test(url) && !url.startsWith("/")) {
                    props.url = "http://" + url;
                }
                props.href = props.url;
            } else if (props.route) {
                let route = props.route;
                if (typeof route === "string") {
                    route = route === "current" ? router.route : router.getRoute(route);
                }

                props.href = null;
                if (!route) {
                    props.href = null;
                } else {
                    props.href = router.createHref(route.name, props.params);
                    if (props.href.startsWith("//")) {
                        // $FlowFixMe
                        props.href = props.href.substring(1); // Get everything after first character (after first slash)
                    }
                }
            }
        }

        const finalProps = {};
        each(props, (value, prop) => {
            if (this.allowedProps.includes(prop) || prop.startsWith("data-")) {
                finalProps[prop] = value;
            }
        });

        if (props.onClick) {
            props.onClick = e => props.onClick && props.onClick({ event: e });
        }

        return finalProps;
    };

    render() {
        return <a {...this.getLinkProps()}>{this.props.children}</a>;
    }
}

export default Link;
