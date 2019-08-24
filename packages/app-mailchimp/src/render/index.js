// @flow
import React from "react";
import type { PluginType } from "@webiny/plugins/types";
import RenderMailchimpForm from "./components/RenderMailchimpForm";
import MailchimpDefaultForm from "./components/MailchimpDefaultForm";

export default ([
    {
        name: "pb-render-page-element-mailchimp",
        type: "pb-render-page-element",
        elementType: "mailchimp",
        render(props: *) {
            return <RenderMailchimpForm {...props} />;
        }
    },
    {
        type: "pb-page-element-mailchimp-component",
        name: "pb-page-element-mailchimp-component-default",
        title: "Default newsletter form",
        componentName: "default",
        component: MailchimpDefaultForm
    }
]: Array<PluginType>);
