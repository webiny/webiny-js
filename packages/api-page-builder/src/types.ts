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

export type MappedFileData = Map<string, FileData>;

export type PageData = {
    id: string;
    category: string;
    title: string;
    url: string;
    content: {
        id: string;
        data: any;
        settings: any;
        elements: any[];
        path: string;
        type: string;
    };
    settings: {
        general: {
            tags: string[];
            layout: string;
            image: any;
        };
        seo: {
            meta: any[];
            title: string | null;
            description: string | null;
        };
        social: {
            meta: any[];
            title: string | null;
            description: string | null;
            image: any;
        };
    };
    version: number;
    parent: string;
    locked: boolean;
};
