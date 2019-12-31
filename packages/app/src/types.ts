import { PluginType } from "@webiny/plugins/types";
export { ImageComponentPluginType } from "./components/Image";

export interface FileUploaderPlugin extends PluginType {
    upload: () => Promise<Object>;
}

export { PluginType };
