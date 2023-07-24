import React from "react";
import { Theme, PageLayout, FormLayout } from "@webiny/admin";
import { Cognito } from "@webiny/app-admin-users-cognito";

import theme from "./themes/default";
import StaticLayout from "./layouts/pages/Static";
import DefaultFormLayout from "./layouts/forms/DefaultFormLayout";

// eslint-disable-next-line react/display-name
export default () => (
    <>
        <Theme theme={theme} />
        <PageLayout name={"static"} title={"Static page"} component={StaticLayout} />
        <FormLayout name={"default"} title={"Default form layout"} component={DefaultFormLayout} />

        <Cognito />
    </>
);
