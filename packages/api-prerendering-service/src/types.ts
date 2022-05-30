import { Args as QueueAddArgs, Tag } from "~/queue/add/types";

export interface HandlerResponse<TData = Record<string, any>, TError = Record<string, any>> {
    data: TData | null;
    error: TError | null;
}

/**
 * Contains data about the previously performed render process for given URL.
 */
export interface Render {
    namespace: string;
    url: string;
    args?: Record<string, any>;
    configuration?: Record<string, any>;
    files: {
        name: string;
        type: string;
        meta: {
            tags?: TagUrlLink[];
            [key: string]: any;
        };
    }[];
}

/**
 * Represents a single queue job. A single job can include multiple paths or tags that need to be rendered / flushed.
 */
export interface QueueJob {
    id: string;
    args: QueueAddArgs;
}

/**
 * Represents a link between a tag (that contains a key and value) and a URL.
 * Note that if you want to get URL and all of its tags, use Render.
 */
export interface TagUrlLink {
    namespace: string;
    url: string;
    key: string;
    value: string;
}

export interface PrerenderingServiceStorageOperationsGetRenderParams {
    where: {
        namespace: string;
        url: string;
    };
}

export interface PrerenderingServiceStorageOperationsDeleteRenderParams {
    render: Render;
}

export interface PrerenderingServiceStorageOperationsListRendersParams {
    where: {
        namespace: string;
        url?: string;
        tag?: Tag;
    };
}

export interface PrerenderingServiceStorageOperationsCreateRenderParams {
    render: Render;
}

export interface PrerenderingServiceStorageOperationsCreateQueueJobParams {
    queueJob: QueueJob;
}

export interface PrerenderingServiceStorageOperationsDeleteQueueJobsParams {
    queueJobs: QueueJob[];
}
// eslint-disable-next-line
export interface PrerenderingServiceStorageOperationsListQueueJobsParams {
    // nothing required yet
}

export interface PrerenderingServiceStorageOperationsCreateTagUrlLinksParams {
    tagUrlLinks: TagUrlLink[];
}

export interface PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams {
    tags: Tag[];
    namespace: string;
    url?: string;
}

export interface PrerenderingServiceStorageOperationsListTagUrlLinksParams {
    where: {
        namespace: string;
        tag: {
            key: string;
            value?: string;
        };
    };
}

export interface PrerenderingServiceRenderStorageOperations {
    getRender: (
        params: PrerenderingServiceStorageOperationsGetRenderParams
    ) => Promise<Render | null>;
    createRender: (
        params: PrerenderingServiceStorageOperationsCreateRenderParams
    ) => Promise<Render>;
    deleteRender: (params: PrerenderingServiceStorageOperationsDeleteRenderParams) => Promise<void>;
    listRenders: (
        params: PrerenderingServiceStorageOperationsListRendersParams
    ) => Promise<Render[]>;
    createTagUrlLinks: (
        params: PrerenderingServiceStorageOperationsCreateTagUrlLinksParams
    ) => Promise<TagUrlLink[]>;

    deleteTagUrlLinks: (
        params: PrerenderingServiceStorageOperationsDeleteTagUrlLinksParams
    ) => Promise<void>;

    listTagUrlLinks: (
        params: PrerenderingServiceStorageOperationsListTagUrlLinksParams
    ) => Promise<TagUrlLink[]>;
}

export interface PrerenderingServiceQueueJobStorageOperations {
    createQueueJob: (
        params: PrerenderingServiceStorageOperationsCreateQueueJobParams
    ) => Promise<QueueJob>;
    deleteQueueJobs: (
        params: PrerenderingServiceStorageOperationsDeleteQueueJobsParams
    ) => Promise<QueueJob[]>;

    listQueueJobs: (
        params?: PrerenderingServiceStorageOperationsListQueueJobsParams
    ) => Promise<QueueJob[]>;
}

export interface PrerenderingServiceStorageOperations
    extends PrerenderingServiceRenderStorageOperations,
        PrerenderingServiceQueueJobStorageOperations {
    //
}

export interface Configuration {
    db?: {
        namespace?: string;
        folder?: {
            namespace?: string;
        };
    };
    storage?: {
        folder?: string;
        name?: string;
    };
    website?: {
        url?: string;
    };
    meta?: {
        notFoundPage?: string;
        tenant?: string;
        locale?: string;
        [key: string]: any | undefined;
    };
}

export interface Args {
    url?: string;
    path?: string;
    configuration?: Configuration;
}

export interface RenderPagesEvent extends Args {
    /** Render pages only in a specific variant. */
    variant?: string;
    tag?: {
        key: string;
        value?: string;
    };
}
