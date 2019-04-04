// @flow
import React from "react";
import type { PluginType } from "webiny-plugins/types";
import RenderMailchimpForm from "./components/RenderMailchimpForm";
import MailchimpDefaultForm from "./components/MailchimpDefaultForm";

export default ([
    {
        name: "cms-render-element-mailchimp",
        type: "cms-render-element",
        element: "cms-element-mailchimp",
        render(props: *) {
            return <RenderMailchimpForm {...props} />;
        }
    },
    {
        type: "cms-element-mailchimp-component",
        name: "cms-element-mailchimp-component-default",
        title: "Default newsletter form",
        component: MailchimpDefaultForm
    }
]: Array<PluginType>);
