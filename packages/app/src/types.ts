import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { CSSProperties } from "react";

export interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
    };
    [key: string]: any;
}

export type WebinyInitPlugin = Plugin & {
    type: "webiny-init";
    init(): void;
};

export type UploadOptions = {
    apolloClient: ApolloClient<object>;
};

export type UiStatePlugin = Plugin & {
    type: "ui-state";
    render(): React.ReactElement;
};

export type FileUploaderPlugin = Plugin & {
    type: "file-uploader";
    // TODO: @adrian define type for the returned object
    upload(file: FileItem, options: UploadOptions): Promise<any>;
};

export type AppFileManagerStoragePlugin = Plugin & {
    type: "app-file-manager-storage";
    // TODO: @adrian define type for the returned object
    upload(file: FileItem, options: UploadOptions): Promise<any>;
};

export { Plugin };

export interface ImageProps {
    src: string;
    preset?: string;
    transform?: {
        [key: string]: any;
    };
    // "auto" is a special keyword - if present, plugins insert their own srcSet.
    srcSet?: { [key: string]: any } | "auto";
    className?: string;
    title?: string;
    alt?: string;
    style?: CSSProperties;
    width?: string | number;
    height?: string | number;
}

/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export type ImageComponentPlugin = Plugin & {
    type: "image-component";
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Record<string, any>) => string;
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

interface CacheGetObjectIdPluginObj {
    __typename: string;
    modelId: string;
    [key: string]: any;
}
export type CacheGetObjectIdPlugin = Plugin & {
    type: "cache-get-object-id";
    getObjectId(obj: CacheGetObjectIdPluginObj): string | undefined;
};
