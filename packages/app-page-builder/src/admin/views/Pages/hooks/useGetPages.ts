import { LinkItem } from "@webiny/app-folders/types";
import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { GET_PAGE } from "~/admin/graphql/pages";
import { useApolloClient } from "@apollo/react-hooks";
import { PagesLinksActions, PbPageDataLink, Loading, PbPageData } from "~/types";
import { useEffect, useState, SetStateAction, Dispatch } from "react";
import { FOLDER_ID_DEFAULT } from "~/admin/constants/folders";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { useLinks } from "@webiny/app-folders";

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

const useGetPages = (links: LinkItem[], folderId = FOLDER_ID_DEFAULT) => {
    const client = useApolloClient();
    const pageBuilder = useAdminPageBuilder();
    const { deleteLink } = useLinks(folderId);
    const [pages, setPages] = useState<PbPageDataLink[]>([]);
    const [loading, setLoading] = useState<Loading<PagesLinksActions>>({});
    const [times, setTimes] = useState<number>(0);

    const getPagesByLinks = (links: LinkItem[]): Promise<PbPageDataLink[]> => {
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

                return {
                    ...data,
                    link
                };
            })
        );
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

    const deletePage = (id: string): void => {
        return setPages(pages => {
            // Since the `pid` is not available, we create this
            const [pid] = id.split("#");
            const index = pages.findIndex(page => page.pid === pid);

            if (index > -1) {
                // Delete the link bound to the deleted page
                deleteLink(pages[index].link);
                // Remove the page from tha state
                pages.splice(index, 1);
            }
            return pages;
        });
    };

    useEffect(() => {
        setTimes(0);
    }, [folderId]);

    useEffect(() => {
        async function getPagesData() {
            if (links.length > 0) {
                const action = times > 0 ? "LIST_MORE_PAGES_BY_LINKS" : "LIST_PAGES_BY_LINKS";

                loadingHandler(folderId, action, setLoading);

                const linkedPages = await getPagesByLinks(links);
                setPages(linkedPages);

                setTimes(prev => prev + 1);
                loadingHandler(folderId, action, setLoading);
            }
        }

        getPagesData();
    }, [links.map(link => link.id).join(".")]);

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

    useEffect(() => {
        return pageBuilder.onPageDelete(next => async params => {
            deletePage(params.page.id);
            return await next(params);
        });
    }, [pages]);

    return {
        pages,
        loading: loading[folderId] || {}
    };
};

export default useGetPages;
