import React from "react";
import { Plugin } from "@webiny/app/types";

export type CognitoViewLogoPlugin = Plugin & {
    name: "cognito-view-logo";
    type: "cognito-view";
    component?: React.FunctionComponent;
    src?: string;
};
