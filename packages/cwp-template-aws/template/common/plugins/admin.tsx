import React from "react";
import { ThemePlugin, PbPageLayoutPlugin, FbFormLayoutPlugin } from "@webiny/admin";
import { Cognito } from "@webiny/app-admin-users-cognito";

import theme from "./website/theme";
import StaticLayout from "./website/layouts/pages/Static";
import DefaultFormLayout from "./website/layouts/forms/DefaultFormLayout";

// eslint-disable-next-line react/display-name
export default () => (
    <>
        <ThemePlugin theme={theme} />
        <PbPageLayoutPlugin name={"static"} title={"Static page"} component={StaticLayout} />

        <FbFormLayoutPlugin
            name={"default"}
            title={"Default form layout"}
            component={DefaultFormLayout}
        />
        <Cognito />
    </>
);
