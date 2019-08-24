// @flow
import type { PluginType } from "@webiny/plugins/types";
export type { WithDataListProps, WithDataListParams, SearchParams } from "@webiny/app/components";
export type { ImageComponentPluginType } from "@webiny/app/components/Image";

type FileUploaderPlugin = PluginType | { upload: () => Promise<Object> };

export type { PluginType, FileUploaderPlugin };
