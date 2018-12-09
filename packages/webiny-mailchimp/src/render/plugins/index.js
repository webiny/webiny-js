// @flow
import React from "react";
import type { RenderElementPluginType } from "webiny-app-cms/types";
import RenderMailchimpForm from "./components/RenderMailchimpForm";

export default ([
    {
        name: "cms-render-element-mailchimp",
        type: "cms-render-element",
        element: "cms-element-mailchimp",
        render(props: *) {
            return <RenderMailchimpForm {...props} />;
        }
    }
]: Array<RenderElementPluginType>);
