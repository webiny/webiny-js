import React from "react";
import { Theme, PageLayout, FormLayout } from "@webiny/website";

import theme from "./website/theme";
import StaticLayout from "./website/layouts/pages/Static";
import DefaultFormLayout from "./website/layouts/forms/DefaultFormLayout";

// eslint-disable-next-line react/display-name
export default () => (
    <>
        <Theme theme={theme} />
        <PageLayout name={"static"} title={"Static page"} component={StaticLayout} />
        <FormLayout
            name={"default"}
            title={"Default form layout"}
            component={DefaultFormLayout}
        />
    </>
);
