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
    name: "admin-welcome-screen-widget-form-builder",
    scopes: ["forms:form:crud"],
    widget: {
        cta: (
            <Link to="/forms" className={linkStyle}>
                <ButtonSecondary className={buttonStyle}>Create a new Form</ButtonSecondary>
            </Link>
        ),
        description: "Create forms using a drag and drop interface and track conversions.",
        title: "Form Builder"
    }
}
export default plugin;
