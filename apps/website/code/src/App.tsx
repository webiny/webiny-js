import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { BrowserRouter, Switch, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { PageElementsProvider } from "@webiny/app-page-builder-elements/contexts/PageElements";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

// Elements.
import Block from "@webiny/app-page-builder-elements/elements/block";
// import Button from "@webiny/app-page-builder-elements/elements/button";
import Cell from "@webiny/app-page-builder-elements/elements/cell";
import Document from "@webiny/app-page-builder-elements/elements/document";
// import Embeds from "@webiny/app-page-builder-elements/elements/embeds";
import Grid from "@webiny/app-page-builder-elements/elements/grid";
import Heading from "@webiny/app-page-builder-elements/elements/heading";
// import Icon from "@webiny/app-page-builder-elements/elements/icon";
// import Image from "@webiny/app-page-builder-elements/elements/image";
import List from "@webiny/app-page-builder-elements/elements/list";
// import PagesList from "@webiny/app-page-builder-elements/elements/pagesList";
import Paragraph from "@webiny/app-page-builder-elements/elements/paragraph";
import Quote from "@webiny/app-page-builder-elements/elements/quote";

const elements = {
    block: Block,
    cell: Cell,
    document: Document,
    grid: Grid,
    heading: Heading,
    list: List,
    paragraph: Paragraph,
    quote: Quote
};

// Styles.
import align from "@webiny/app-page-builder-elements/styles/align";
// import animation from "@webiny/app-page-builder-elements/styles/animation";
import background from "@webiny/app-page-builder-elements/styles/background";
// import border from "@webiny/app-page-builder-elements/styles/border";
import height from "@webiny/app-page-builder-elements/styles/height";
import margin from "@webiny/app-page-builder-elements/styles/margin";
import padding from "@webiny/app-page-builder-elements/styles/padding";
// import shadow from "@webiny/app-page-builder-elements/styles/shadow";
import text from "@webiny/app-page-builder-elements/styles/text";
// import visibility from "@webiny/app-page-builder-elements/styles/visibility";
import width from "@webiny/app-page-builder-elements/styles/width";

const styles = [align, background, height, margin, padding, text, width];

// Display modes.
import displayModes from "@webiny/app-page-builder-elements/displayModes";

// Theme

const theme = {
    colors: {
        primary: "var(--webiny-theme-color-primary)",
        secondary: "var(--webiny-theme-color-secondary)",
        background: "var(--webiny-theme-color-background)",
        surface: "var(--webiny-theme-color-surface)",
        textPrimary: "var(--webiny-theme-color-text-primary)"
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
        heading: {
            types: [{ className: "webiny-pb-typography-heading", label: "Default" }]
        },
        paragraph: {
            types: [
                { className: "webiny-pb-typography-body", label: "Body" },
                { className: "webiny-pb-typography-description", label: "Description" }
            ]
        },
        list: {
            types: [
                { className: "", label: "Default" },
                { className: "webiny-pb-typography-list--primary", label: "Primary" },
                { className: "webiny-pb-typography-list--secondary", label: "Secondary" }
            ]
        },
        quote: {
            types: [{ className: "webiny-pb-typography-quote", label: "Default" }]
        }
    }
};

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <PageElementsProvider
                theme={theme}
                elements={elements}
                styles={styles}
                displayModes={displayModes}
            >
                <PageBuilderProvider>
                    <Switch>
                        <Route path={"*"} component={Page} />
                    </Switch>
                </PageBuilderProvider>
            </PageElementsProvider>
        </BrowserRouter>
    </ApolloProvider>
);
