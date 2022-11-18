import { LinkItem } from "@webiny/app-folders/types";
import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { GET_PAGE } from "~/admin/graphql/pages";
import { useApolloClient } from "@apollo/react-hooks";
import { PbPageData } from "~/types";
import { useEffect, useState } from "react";

const useGetPages = (links: LinkItem[]) => {
    const client = useApolloClient();
    const [pages, setPages] = useState<PbPageData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const getPagesByLinks = (links: LinkItem[]): Promise<PbPageData[]> => {
        return Promise.all(
            links.map(async link => {
                const { data: response } = await client.query<
                    GetPageQueryResponse,
                    GetPageQueryVariables
                >({
                    query: GET_PAGE,
                    variables: { id: link.id }
                });

                const { data, error } = response.pageBuilder.getPage;

                if (!data) {
                    throw new Error(error?.message || "Could not fetch page");
                }

                return data;
            })
        );
    };

    useEffect(() => {
        async function getPagesData() {
            setLoading(true);
            const linkedPages = await getPagesByLinks(links);
            setPages(linkedPages);
            setLoading(false);
        }

        getPagesData();
    }, [JSON.stringify(links)]);
    //TODO: test https://github.com/kentcdodds/use-deep-compare-effect

    return {
        pages,
        loading
    };
};

export default useGetPages;
