// @flow
import "./style/theme.scss";
import StaticLayout from "./layouts/static";
import BlogLayout from "./layouts/blog";
import DefaultFormLayout from "./layouts/forms/DefaultFormLayout";

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
    forms: {
        layouts: [{ name: "default", title: "Default layout", component: DefaultFormLayout }]
    },
    colors: {
        primary: "var(--webiny-pb-theme-primary)",
        secondary: "var(--webiny-pb-theme-secondary)",
        background: "var(--webiny-pb-theme-background)",
        surface: "var(--webiny-pb-theme-surface)",
        textPrimary: "var(--webiny-pb-theme-text-primary)"
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
        }
    },
    typography: {
        h1: {
            label: "Heading 1",
            component: "h1",
            className: "webiny-pb-typography-h1"
        },
        h1White: {
            label: "Heading 1 (white)",
            component: "h1",
            className: "webiny-pb-typography-h1 webiny-pb-typography--white"
        },
        h2: {
            label: "Heading 2",
            component: "h2",
            className: "webiny-pb-typography-h2"
        },
        h2White: {
            label: "Heading 2 (white)",
            component: "h2",
            className: "webiny-pb-typography-h2 webiny-pb-typography--white"
        },
        h3: {
            label: "Heading 3",
            component: "h3",
            className: "webiny-pb-typography-h3"
        },
        h3White: {
            label: "Heading 3 (white)",
            component: "h3",
            className: "webiny-pb-typography-h3 webiny-pb-typography--white"
        },
        h4: {
            label: "Heading 4",
            component: "h4",
            className: "webiny-pb-typography-h4"
        },
        h4White: {
            label: "Heading 4 (white)",
            component: "h4",
            className: "webiny-pb-typography-h4 webiny-pb-typography--white"
        },
        h5: {
            label: "Heading 5",
            component: "h5",
            className: "webiny-pb-typography-h5"
        },
        h5White: {
            label: "Heading 5 (white)",
            component: "h5",
            className: "webiny-pb-typography-h5 webiny-pb-typography--white"
        },
        h6: {
            label: "Heading 6",
            component: "h6",
            className: "webiny-pb-typography-h6"
        },
        h6White: {
            label: "Heading 6 (white)",
            component: "h6",
            className: "webiny-pb-typography-h6 webiny-pb-typography--white"
        },
        paragraph: {
            label: "Paragraph",
            component: "p",
            className: "webiny-pb-typography-body"
        },
        paragraphWhite: {
            label: "Paragraph (white)",
            component: "p",
            className: "webiny-pb-typography-body webiny-pb-typography--white"
        },
        description: {
            label: "Description",
            component: "p",
            className: "webiny-pb-typography-description"
        },
        descriptionWhite: {
            label: "Description (white)",
            component: "p",
            className: "webiny-pb-typography-description webiny-pb-typography--white"
        },
        primaryColorText: {
            label: "Primary color text",
            component: "p",
            className: "webiny-pb-typography-body webiny-pb-typography--primary"
        }
    }
};
