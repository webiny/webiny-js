import React from "react";
import fileUploadPlugin from "./fileUploaderPlugin";
import imagePlugin from "./imagePlugin";
interface RenderPluginOptions {
    wrapper?: boolean;
    fn?: string;
    filter?: Function;
}
export { fileUploadPlugin, imagePlugin };
export declare const renderPlugin: (name: string, params?: Object, { wrapper, fn }?: RenderPluginOptions) => string | number | boolean | {} | React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)> | React.ReactNodeArray | React.ReactPortal | React.ReactNode[];
export declare const renderPlugins: (type: string, params?: Object, { wrapper, fn, filter }?: RenderPluginOptions) => string | number | boolean | {} | React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)>) | (new (props: any) => React.Component<any, any, any>)> | React.ReactNodeArray | React.ReactPortal | React.ReactNode[];
declare const _default: ((() => {
    type: string;
    name: string;
    upload: (file: File, { apolloClient }: {
        apolloClient: any;
    }) => Promise<unknown>;
}) | import("../types").ImageComponentPlugin)[];
export default _default;
