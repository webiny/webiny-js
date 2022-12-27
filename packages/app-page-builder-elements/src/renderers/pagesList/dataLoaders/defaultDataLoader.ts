import { DataLoader } from "~/renderers/pagesList/types";

export const LIST_PUBLISHED_PAGES = /* GraphQL */ `
    query ListPublishedPages(
        $where: PbListPublishedPagesWhereInput
        $limit: Int
        $sort: [PbListPagesSort!]
        $after: String
        $exclude: [String]
    ) {
        pageBuilder {
            listPublishedPages(
                where: $where
                sort: $sort
                limit: $limit
                exclude: $exclude
                after: $after
            ) {
                error {
                    data
                    message
                    code
                }
                data {
                    id
                    title
                    path
                    url
                    snippet
                    tags
                    images {
                        general {
                            src
                        }
                    }
                    publishedOn
                    createdBy {
                        id
                        displayName
                    }
                    category {
                        slug
                        name
                    }
                }
                meta {
                    totalCount
                    cursor
                    hasMoreItems
                }
            }
        }
    }
`;

export interface CreateDefaultDataLoaderParams {
    apiUrl: string;
    query?: string;
    includeHeaders?: Record<string, any>;
}

export type CreateDefaultDataLoader = (params: CreateDefaultDataLoaderParams) => DataLoader;

export const createDefaultDataLoader: CreateDefaultDataLoader = ({
    apiUrl,
    query = LIST_PUBLISHED_PAGES,
    includeHeaders = {}
}) => {
    if (!apiUrl) {
        throw new Error(
            "Default pages list data loader cannot be initialized because the API URL wasn't provided."
        );
    }

    return ({ variables }) => {
        return fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...includeHeaders
            },
            body: JSON.stringify({
                query,
                variables
            })
        })
            .then(res => res.json())
            .then(response => response.data.pageBuilder.listPublishedPages);
    };
};
