import React from "react";
import { RenderMailchimpForm } from "./components/RenderMailchimpForm";
import MailchimpDefaultForm from "./components/MailchimpDefaultForm";
import { PbRenderElementPlugin } from "@webiny/app-page-builder/types";
import { PbPageElementMailchimpComponentPlugin } from "../types";

export default [
    {
        name: "pb-render-page-element-mailchimp",
        type: "pb-render-page-element",
        elementType: "mailchimp",
        render(props) {
            return <RenderMailchimpForm {...props} />;
        }
    } as PbRenderElementPlugin,
    {
        type: "pb-page-element-mailchimp-component",
        name: "pb-page-element-mailchimp-component-default",
        title: "Default newsletter form",
        componentName: "default",
        component: MailchimpDefaultForm
    } as PbPageElementMailchimpComponentPlugin
];
