import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { CSSProperties } from "react";

export type WebinyInitPlugin = Plugin & {
    init(): void;
};

export type UploadOptions = {
    apolloClient: ApolloClient<object>;
};

export type FileUploaderPlugin = Plugin & {
    // TODO: @adrian define type for the returned object
    upload(file: File, options: UploadOptions): Promise<any>;
};

export { Plugin };

export type ImageProps = {
    src: string;
    preset?: string;
    transform?: { [key: string]: any };
    // "auto" is a special keyword - if present, plugins insert their own srcSet.
    srcSet?: { [key: string]: any } | "auto";
    className?: string;
    title?: string;
    alt?: string;
    style?: CSSProperties;
};

/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export type ImageComponentPlugin = Plugin & {
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Object) => string;
    presets: { [key: string]: any };
};

export type RoutePlugin = Plugin & {
    route: React.ReactElement;
};
