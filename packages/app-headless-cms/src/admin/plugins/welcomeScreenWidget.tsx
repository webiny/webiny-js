import React from "react";
import { Link } from "@webiny/react-router";

import { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-plugin-admin-welcome-screen/types";
import { ButtonSecondary } from "@webiny/ui/Button";
import { css } from "emotion";

const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    }
});

const buttonStyle = css({
    margin: "1rem auto 1rem auto"
});

const plugin: AdminWelcomeScreenWidgetPlugin = {
    type: "admin-welcome-screen-widget",
    name: "admin-welcome-screen-widget-headless-cms",
    scopes: [],
    widget: {
        cta: (
            <Link to="/cms/content-models" className={linkStyle}>
                <ButtonSecondary className={buttonStyle}>New Content Model</ButtonSecondary>
            </Link>
        ),
        description: "GraphQL based headless CMS with powerful content modeling features.",
        title: "Headless CMS"
    }
};

export default plugin;
