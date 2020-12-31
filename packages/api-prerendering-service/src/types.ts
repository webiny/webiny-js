import { Args as QueueAddArgs } from "./queue/add/types";

export type HandlerResponse<TData = Record<string, any>, TError = Record<string, any>> = {
    data: TData;
    error: TError;
};

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
