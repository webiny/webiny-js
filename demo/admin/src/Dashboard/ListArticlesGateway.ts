import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { ListResponseMeta, ReadonlyArticle, ResponseError } from "@demo/shared";
import {
    IListArticlesGateway,
    ListArticlesParams,
    ListArticlesReturn
} from "./Abstractions/IListArticlesGateway";

interface ListArticlesResponse {
    demo: {
        listArticles: {
            data: Array<ReadonlyArticle> | null;
            meta: ListResponseMeta | null;
            error: ResponseError | null;
        };
    };
}

export class ListArticlesGateway implements IListArticlesGateway {
    private client: ApolloClient<any>;
    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(params: ListArticlesParams): Promise<ListArticlesReturn> {
        const { data, errors } = await this.client.query<ListArticlesResponse>({
            query: LIST_READONLY_ARTICLES,
            variables: {
                limit: params.limit,
                search: params.search,
                after: params.after
            },
            fetchPolicy: "no-cache"
        });

        if (errors) {
            console.log(errors);
            throw new Error(`Failed to fetch articles! Check console logs for more details.`);
        }

        return {
            data: data.demo.listArticles.data!,
            meta: data.demo.listArticles.meta!
        };
    }
}

const LIST_READONLY_ARTICLES = gql`
    query ListReadonlyArticles($limit: Int, $after: String, $search: String) {
        demo {
            listArticles(limit: $limit, after: $after, search: $search) {
                data
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
