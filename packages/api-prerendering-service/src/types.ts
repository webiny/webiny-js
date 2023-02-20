export interface Tag {
    key: string;
    value?: string | boolean;
}

/**
 * Represents a single queue job. A single job can include multiple paths or tags that need to be rendered / flushed.
 */
export interface QueueJob {
    id: string;
    args: QueueAddJob;
}

export interface RenderJob {
    tenant: string;
    locale: string;
    tag?: Tag;
    path?: string;
}

export interface FlushJob {
    tenant: string;
    tag?: Tag;
    path?: string;
}

export interface QueueAddJob {
    flush?: FlushJob;
    render?: RenderJob;
}

/**
 * Contains data about the previously performed render process for given path.
 */
export interface Render {
    path: string;
    tenant: string;
    locale: string;
    tags?: Tag[];
    files: {
        name: string;
        type: string;
        meta: {
            tags?: Tag[];
            [key: string]: any;
        };
    }[];
}

/**
 * Represents a link between a tag (that contains a key and value) and a URL.
 * Note that if you want to get URL and all of its tags, use Render.
 */
export interface TagPathLink {
    path: string;
    key: string;
    value: string;
    tenant: string;
}

export interface PrerenderingServiceStorageOperationsGetRenderParams {
    where: {
        tenant: string;
        path: string;
    };
}

export interface PrerenderingServiceStorageOperationsDeleteRenderParams {
    render: Render;
}

export interface PrerenderingServiceStorageOperationsListRendersParams {
    where: {
        tenant: string;
        path?: string;
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

export interface PrerenderingServiceStorageOperationsCreateTagPathLinksParams {
    tagPathLinks: TagPathLink[];
}

export interface PrerenderingServiceStorageOperationsDeleteTagPathLinksParams {
    tags: Tag[];
    tenant: string;
    path: string;
}

export interface PrerenderingServiceStorageOperationsListTagPathLinksParams {
    where: {
        tenant: string;
        tag: Tag;
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
    createTagPathLinks: (
        params: PrerenderingServiceStorageOperationsCreateTagPathLinksParams
    ) => Promise<TagPathLink[]>;

    deleteTagPathLinks: (
        params: PrerenderingServiceStorageOperationsDeleteTagPathLinksParams
    ) => Promise<void>;

    listTagPathLinks: (
        params: PrerenderingServiceStorageOperationsListTagPathLinksParams
    ) => Promise<TagPathLink[]>;
}

export interface PrerenderingServiceTenantStorageOperations {
    getTenantIds: () => Promise<string[]>;
}

export interface PrerenderingServiceSettingsStorageOperations {
    getSettings(): Promise<PrerenderingSettings>;
    saveSettings(params: PrerenderingServiceSaveSettingsParams): Promise<PrerenderingSettings>;
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
        PrerenderingServiceQueueJobStorageOperations,
        PrerenderingServiceSettingsStorageOperations,
        PrerenderingServiceTenantStorageOperations {
    //
}

/**
 * Represents a Lambda function payload for `render` Lambda.
 */
export interface RenderEvent {
    path: string;
    tenant: string;
    locale: string;
    exclude?: string[];
    tags?: Tag[];
}

export interface FlushEvent {
    tenant: string;
    locale: string;
    path?: string;
    tag?: Tag;
}

export interface RenderPagesEvent extends RenderEvent {
    /** Render pages only in a specific variant. */
    variant?: string;
    tag?: Tag;
}

export interface PrerenderingServiceSaveSettingsParams {
    settings: PrerenderingSettings;
    variant?: string;
}

export interface PrerenderingSettings {
    appUrl: string;
    bucket: string;
    cloudfrontId: string;
    sqsQueueUrl?: string;
}
