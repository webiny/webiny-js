export interface Icon {
    name: string;
    src: string;
    tags: string[];
}

export interface ListCustomIconsQueryVariables {
    limit: number;
    sort?: Record<string, any>;
    after?: string | null;
}

export interface ListCustomIconsResponse {
    fileManager: {
        listFiles: {
            data: Icon[] | null;
            error: { message: string; data: Record<string, any>; code: string } | null;
        };
    };
}
