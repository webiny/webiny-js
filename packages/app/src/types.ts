import { Plugin } from "@webiny/plugins/types";
import { ApolloClient } from "apollo-client";

export interface UploadOptions {
    apolloClient: ApolloClient<object>;
}

export interface FileUploaderPlugin extends Plugin {
    // TODO: @adrian define type for the returned object
    upload(file: File, options: UploadOptions): Promise<object>;
}

export { Plugin };

export interface ImageProps {
    src: string;
    preset?: string;
    transform?: { [key: string]: any };
    // "auto" is a special keyword - if present, plugins insert their own srcSet.
    srcSet?: { [key: string]: any } | "auto";
    className?: string;
    alt?: string;
}

/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export interface ImageComponentPlugin extends Plugin {
    render: (props: ImageProps) => React.ReactElement;
    getImageSrc: (props?: Object) => string;
    presets: { [key: string]: any };
}
