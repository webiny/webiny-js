// @flow
import "./style/theme.scss";
import * as React from "react";
import StaticLayout from "./layouts/static";
import BlogLayout from "./layouts/blog";
import PageList from "./components/PageList";
import PageListv2 from "./components/PageListv2";

export default {
    layouts: [
        {
            name: "static",
            title: "Static page",
            component: StaticLayout
        },
        {
            name: "blog",
            title: "Blog",
            component: BlogLayout
        }
    ],
    fonts: {
        google: {
            families: ["Alegreya", "Lato"]
        }
    },
    colors: {
        primary: "var(--webiny-cms-theme-primary)",
        secondary: "var(--webiny-cms-theme-secondary)",
        background: "var(--webiny-cms-theme-background)",
        white: "#fff",
        lightGray: "#F7F7F7",
        green: "#0fcb00",
        yellow: "#fcff00"
    },
    elements: {
        button: {
            types: [
                { className: "", label: "Default" },
                { className: "primary", label: "Primary" },
                { className: "secondary", label: "Secondary" }
            ]
        },
        pagesList: {
            components: [
                {
                    name: "default",
                    title: "Default page list",
                    component: PageList
                },
                {
                    name: "custom",
                    title: "Custom page list",
                    component: PageListv2
                }
            ]
        }
    },
    styles: {
        h1: {
            label: "Heading 1",
            component: "h1",
            className: "webiny-cms-typography-h1"
        },
        h2: {
            label: "Heading 2",
            component: "h2",
            className: "webiny-cms-typography-h2"
        },
        h3: {
            label: "Heading 3",
            component: "h3",
            className: "webiny-cms-typography-h3"
        },
        h4: {
            label: "Heading 4",
            component: "h4",
            className: "webiny-cms-typography-h4"
        },
        h5: {
            label: "Heading 5",
            component: "h5",
            className: "webiny-cms-typography-h5"
        },
        h6: {
            label: "Heading 6",
            component: "h6",
            className: "webiny-cms-typography-h6"
        },
        paragraph: {
            label: "Paragraph",
            component: "p",
            className: "webiny-cms-typography-body"
        },
        custom: {
            label: "Pavel 1",
            component: ({ attributes, children }: Object) => {
                return (
                    <div className={"my-custom-class"} {...attributes}>
                        {children}
                    </div>
                );
            },
            className: "cms-element-custom"
            /*style: {
                fontFamily: "Alegreya",
                fontSize: 14,
                lineHeight: "150%",
                marginBottom: "2em",
                color: "#bb3825"
            }*/
        }
    }
};
