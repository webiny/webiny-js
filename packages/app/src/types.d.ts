import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { CSSProperties } from "react";
export declare type WebinyInitPlugin = Plugin & {
    type: "webiny-init";
    init(): void;
};
export declare type UploadOptions = {
    apolloClient: ApolloClient<object>;
};
export declare type UiStatePlugin = Plugin & {
    type: "ui-state";
    render(): React.ReactElement;
};
export declare type FileUploaderPlugin = Plugin & {
    type: "file-uploader";
    upload(file: File, options: UploadOptions): Promise<any>;
};
export { Plugin };
export declare type ImageProps = {
    src: string;
    preset?: string;
    transform?: {
        [key: string]: any;
    };
    srcSet?: {
        [key: string]: any;
    } | "auto";
    className?: string;
    title?: string;
    alt?: string;
    style?: CSSProperties;
};
/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export declare type ImageComponentPlugin = Plugin & {
    type: "image-component";
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Object) => string;
    presets: {
        [key: string]: any;
    };
};
/**
 * Enables registering new routes.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#route
 */
export declare type RoutePlugin = Plugin & {
    type: "route";
    route: React.ReactElement;
};
