import { Plugin } from "@webiny/plugins";
import { PbContext } from "~/graphql/types";

export interface Tag {
    key: string;
    value?: string;
}

export interface TagItem {
    tag: Tag;
    configuration?: {
        meta?: Record<string, any>;
        storage?: {
            folder?: string;
            name?: string;
        };
    };
}

export interface PathItem {
    path: string;
    configuration?: {
        meta?: Record<string, any>;
        storage?: {
            folder?: string;
            name?: string;
        };
    };
}

export interface RenderParams {
    context: PbContext;
    tags?: TagItem[];
    paths?: PathItem[];
}

export interface FlushParams {
    context: PbContext;
    tags?: TagItem[];
    paths?: PathItem[];
}

export abstract class PrerenderingPagePlugin extends Plugin {
    public static readonly type: string = "pageBuilder.prerendering.page";

    public abstract render(args: RenderParams): Promise<void>;
    public abstract flush(args: FlushParams): Promise<void>;
}
