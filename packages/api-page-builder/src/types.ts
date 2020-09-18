import { Context, Plugin } from "@webiny/graphql/types";

export type PbInstallPlugin = Plugin & {
    name: "pb-install";
    before: (params: { context: Context; data: any }) => void;
    after: (params: { context: Context; data: any }) => void;
};

export type ElementData = {
    id: string;
    name: string;
    category: string;
    content: any;
    data: string;
    preview: string;
};

export type FileData = {
    id: string;
    __physicalFileName: string;
    name: string;
    size: number;
    type: string;
    meta: {
        width?: number;
        height?: number;
        aspectRatio?: number;
        private: boolean;
    };
};
