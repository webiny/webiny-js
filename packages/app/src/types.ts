import * as React from "react";
import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";
import { CSSProperties } from "react";

export type GenericRecordKey = string | number | symbol;

export type GenericRecord<K extends GenericRecordKey = GenericRecordKey, V = any> = Record<K, V>;

export type UploadOptions = {
    apolloClient: ApolloClient<object>;
    onProgress?: (params: { sent: number; total: number; percentage: number }) => void;
};

export type UiStatePlugin = Plugin & {
    type: "ui-state";
    render(): React.ReactElement;
};

export interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    key: string;
}

export type FileUploaderPlugin = Plugin & {
    type: "file-uploader";
    name: "file-uploader";
    upload(file: File, options: UploadOptions): Promise<UploadedFile>;
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
