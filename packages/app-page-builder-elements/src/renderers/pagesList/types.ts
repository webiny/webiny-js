import React from "react";

export interface PagesListPage {
    id: string;
    title: string;
    path: string;
    url: string;
    snippet: string;
    tags: string;
    images: {
        general: {
            src: string;
        };
    };
    publishedOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    category: {
        slug: string;
        name: string;
    };
}

export interface DataLoaderVariables {
    sort: string | null;
    where: {
        category: string;
        tags: {
            query: string[];
            rule: "all" | "any";
        };
    };
    limit: number;
    after: string | null;
    exclude: string[];
}

export interface DataLoaderParams {
    variables: DataLoaderVariables;
}

export interface DataLoaderResult {
    data: Array<PagesListPage>;
    meta: {
        totalCount: number;
        cursor: string;
        hasMoreItems: boolean;
    };
}

export type DataLoader = (params: DataLoaderParams) => Promise<DataLoaderResult>;

interface PagesListComponentProps {
    loading: boolean;
    initialLoading: boolean;
    variables: DataLoaderVariables;
    data: DataLoaderResult | null;
    nextPage: () => void;
    hasNextPage: boolean;
    previousPage: () => void;
    hasPreviousPage: boolean;
}

export type PagesListComponent = React.ComponentType<PagesListComponentProps>;
