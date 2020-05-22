import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { CSSProperties } from "react";

export type WebinyInitPlugin = Plugin & {
    type: "webiny-init";
    init(): void;
};

export type UploadOptions = {
    apolloClient: ApolloClient<object>;
};

export type FileUploaderPlugin = Plugin & {
    type: "file-uploader";
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
    type: "image-component";
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Object) => string;
    presets: { [key: string]: any };
};

/**
 * Enables registering new routes.
 * @see https://docs.webiny.com/docs/webiny-apps/admin/development/plugins-reference/app#route
 */
export type RoutePlugin = Plugin & {
    type: "route";
    route: React.ReactElement;
};
