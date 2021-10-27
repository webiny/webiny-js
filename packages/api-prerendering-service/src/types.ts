import { Args as QueueAddArgs, Tag } from "./queue/add/types";

export interface HandlerResponse<TData = Record<string, any>, TError = Record<string, any>> {
    data: TData;
    error: TError;
}

// TODO delete everything after this
export enum TYPE {
    DbRender = "ps.render",
    DbTagUrlLink = "ps.tagUrlLink",
    DbQueueJob = "ps.queue.job"
}

// Contains data about the previously performed render process for given URL.
export type DbRender = {
    PK: string;
    SK: string;
    TYPE: TYPE.DbRender;
    url: string;
    args?: Record<string, any>;
    configuration?: Record<string, any>;
    files: { name: string; type: string; meta: Record<string, any> }[];
};

// Represents a link between a tag (that contains a key and value) and a URL.
// Note that if you want to get URL and all of its tags, use DbRender.
export type DbTagUrlLink = {
    PK: string;
    SK: string;
    TYPE: TYPE.DbTagUrlLink;
    url: string;
    key: string;
    value: string;
};

// Represents a single queue job. A single job can include multiple paths or tags that need to be rendered / flushed.
export type DbQueueJob = {
    PK: "PS#Q#JOB";
    SK: string;
    TYPE: TYPE.DbQueueJob;
    args: QueueAddArgs;
};

// TODO delete everything before this

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
        meta: Record<string, any>;
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
    getRender: (params: PrerenderingServiceStorageOperationsGetRenderParams) => Promise<Render>;
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
