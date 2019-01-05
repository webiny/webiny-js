// @flow
import "./style/theme.scss";
import StaticLayout from "./layouts/static";
import BlogLayout from "./layouts/blog";
import PageList from "./components/PageList";
import PageListv2 from "./components/PageListv2";
import DefaultMenu from "./components/DefaultMenu";
import { MailchimpDefaultForm } from "webiny-integration-mailchimp/components";

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
            families: ["IBM Plex Sans:400,500,700", "Lato:400,500,700"]
        }
    },
    colors: {
        primary: "var(--webiny-cms-theme-primary)",
        secondary: "var(--webiny-cms-theme-secondary)",
        background: "var(--webiny-cms-theme-background)",
        surface: "var(--webiny-cms-theme-surface)",
        textPrimary: "var(--webiny-cms-theme-text-primary)"
    },
    components: {
        menu: [
            {
                name: "default",
                component: DefaultMenu
            }
        ]
    },
    elements: {
        button: {
            types: [
                { className: "", label: "Default" },
                { className: "primary", label: "Primary" },
                { className: "secondary", label: "Secondary" },
                { className: "outline-primary", label: "Outline Primary" },
                { className: "outline-secondary", label: "Outline Secondary" },
                { className: "simple", label: "Simple" }
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
        },
        mailchimp: {
            components: [
                {
                    name: "default",
                    title: "Default page list",
                    component: MailchimpDefaultForm
                }
            ]
        }
    },
    typography: {
        h1: {
            label: "Heading 1",
            component: "h1",
            className: "webiny-cms-typography-h1"
        },
        h1White: {
            label: "Heading 1 (white)",
            component: "h1",
            className: "webiny-cms-typography-h1 webiny-cms-typography--white"
        },
        h2: {
            label: "Heading 2",
            component: "h2",
            className: "webiny-cms-typography-h2"
        },
        h2White: {
            label: "Heading 2 (white)",
            component: "h2",
            className: "webiny-cms-typography-h2 webiny-cms-typography--white"
        },
        h3: {
            label: "Heading 3",
            component: "h3",
            className: "webiny-cms-typography-h3"
        },
        h3White: {
            label: "Heading 3 (white)",
            component: "h3",
            className: "webiny-cms-typography-h3 webiny-cms-typography--white"
        },
        h4: {
            label: "Heading 4",
            component: "h4",
            className: "webiny-cms-typography-h4"
        },
        h4White: {
            label: "Heading 4 (white)",
            component: "h4",
            className: "webiny-cms-typography-h4 webiny-cms-typography--white"
        },
        h5: {
            label: "Heading 5",
            component: "h5",
            className: "webiny-cms-typography-h5"
        },
        h5White: {
            label: "Heading 5 (white)",
            component: "h5",
            className: "webiny-cms-typography-h5 webiny-cms-typography--white"
        },
        h6: {
            label: "Heading 6",
            component: "h6",
            className: "webiny-cms-typography-h6"
        },
        h6White: {
            label: "Heading 6 (white)",
            component: "h6",
            className: "webiny-cms-typography-h6 webiny-cms-typography--white"
        },
        paragraph: {
            label: "Paragraph",
            component: "p",
            className: "webiny-cms-typography-body"
        },
        paragraphWhite: {
            label: "Paragraph (white)",
            component: "p",
            className: "webiny-cms-typography-body webiny-cms-typography--white"
        },
        description: {
            label: "Description",
            component: "p",
            className: "webiny-cms-typography-description"
        },
        descriptionWhite: {
            label: "Description (white)",
            component: "p",
            className: "webiny-cms-typography-description webiny-cms-typography--white"
        },
        primaryColorText: {
            label: "Primary color text",
            component: "p",
            className: "webiny-cms-typography-body webiny-cms-typography--primary"
        }
    }
};
