import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
export declare type WebinyInitPlugin = Plugin & {
    init(): void;
};
export declare type UploadOptions = {
    apolloClient: ApolloClient<object>;
};
export declare type FileUploaderPlugin = Plugin & {
    upload(file: File, options: UploadOptions): Promise<object>;
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
    alt?: string;
};
/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export declare type ImageComponentPlugin = Plugin & {
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Object) => string;
    presets: {
        [key: string]: any;
    };
};
export declare type RoutePlugin = Plugin & {
    route: React.ReactElement;
};
