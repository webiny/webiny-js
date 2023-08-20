import React from "react";
import { Theme, PageLayout, FormLayout, Cognito } from "@webiny/admin";
import path from "path";

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

        <Api.ContextPlugin apply={() => { console.log('APPLYING CONTEXT PLUGIN') }} />
    </>
);
