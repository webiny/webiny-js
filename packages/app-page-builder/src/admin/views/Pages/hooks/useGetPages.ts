import { LinkItem, LinksActions, Loading as LinksLoading } from "@webiny/app-folders/types";
import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { GET_PAGE } from "~/admin/graphql/pages";
import { useApolloClient } from "@apollo/react-hooks";
import { PagesLinksActions, PbPageDataLink, Loading, PbPageData } from "~/types";
import { useEffect, useState, SetStateAction, Dispatch } from "react";
import { FOLDER_ID_DEFAULT } from "~/admin/constants/folders";
import useDeepCompareEffect from "use-deep-compare-effect";

export const loadingHandler = <T extends string>(
    context: string,
    action: T,
    setState: Dispatch<SetStateAction<Loading<T>>>
): void => {
    setState(state => {
        const currentContext = state[context] || {};
        const currentAction = currentContext[action] || false;
        return {
            ...state,
            [context]: {
                ...currentContext,
                [action]: !currentAction
            }
        };
    });
};

const useGetPages = (
    links: LinkItem[],
    linksLoading: LinksLoading<LinksActions>,
    folderId = FOLDER_ID_DEFAULT
) => {
    const client = useApolloClient();
    const [pages, setPages] = useState<PbPageDataLink[]>([]);
    const [loading, setLoading] = useState<Loading<PagesLinksActions>>({});
    const [times, setTimes] = useState<number>(0);

    const getPagesByLinks = (links: LinkItem[]): void => {
        const action = times > 0 ? "LIST_MORE_PAGES_BY_LINKS" : "LIST_PAGES_BY_LINKS";
        loadingHandler(folderId, action, setLoading);

        if (links.length === 0) {
            loadingHandler(folderId, action, setLoading);
            setPages([]);
            return;
        }

        Promise.all(
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

                return {
                    ...data,
                    link
                };
            })
        ).then((data: PbPageDataLink[]) => {
            setPages(data);
            loadingHandler(folderId, action, setLoading);
            setTimes(prev => prev + 1);
        });
    };

    const updatePage = (page: PbPageData) => {
        setPages(prevPages => {
            const pageIndex = prevPages.findIndex(f => f.pid === page.pid);

            if (pageIndex === -1) {
                return prevPages;
            }

            return [
                ...prevPages.slice(0, pageIndex),
                {
                    ...prevPages[pageIndex],
                    ...page
                },
                ...prevPages.slice(pageIndex + 1)
            ];
        });
    };

    useEffect(() => {
        setTimes(0);
    }, [folderId]);

    useDeepCompareEffect(() => {
        getPagesByLinks(links);
    }, [links.map(link => link.id).join("."), linksLoading]);

    useEffect(() => {
        links.map(link => {
            return client
                .watchQuery<GetPageQueryResponse, GetPageQueryVariables>({
                    query: GET_PAGE,
                    variables: { id: link.id }
                })
                .subscribe({
                    next(response) {
                        const { data, error } = response.data.pageBuilder.getPage;

                        // No need to continue in case of error or missing data
                        if (!data || error) {
                            return;
                        }

                        updatePage(data);
                    }
                });
        });
    }, []);

    return {
        pages: pages,
        loading: loading[folderId] || {}
    };
};

export default useGetPages;
