import React from "react";
import { Link } from "@webiny/react-router";

import { AdminWelcomeScreenWidgetPlugin } from "@webiny/app-admin/types";
import { ButtonSecondary } from "@webiny/ui/Button";
import { css } from "emotion";

const linkStyle = css({
    textDecoration: "none",
    "&:hover": {
        textDecoration: "none"
    }
});

const plugin: AdminWelcomeScreenWidgetPlugin = {
    type: "admin-welcome-screen-widget",
    name: "admin-welcome-screen-widget-page-builder",
    widget: {
        cta: (
            <Link to="page-builder/pages" className={linkStyle}>
                <ButtonSecondary>
                    Build a new Page
                </ButtonSecondary>                 
            </Link>
        ),
        description: "Build stunning landing pages with an easy to use drag and drop editor.",
        title: "Page Builder"        
    }
};

export default plugin;