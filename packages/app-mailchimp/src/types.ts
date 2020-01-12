import { Plugin } from "@webiny/app/types";
import { ComponentType } from "react";

export type PbPageElementMailchimpComponentPlugin = Plugin & {
    type: "pb-page-element-mailchimp-component";
    title: string;
    componentName: string;
    component: ComponentType<any>;
};
