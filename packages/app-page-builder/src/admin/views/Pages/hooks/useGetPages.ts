import { LinkItem } from "@webiny/app-aco/types";
import { GetPageQueryResponse, GetPageQueryVariables } from "~/pageEditor/graphql";
import { GET_PAGE } from "~/admin/graphql/pages";
import { useApolloClient } from "@apollo/react-hooks";
import { PbPageDataLink, Loading, PbPageData, LoadingActions } from "~/types";
import { useEffect, useState } from "react";
import { FOLDER_ID_DEFAULT } from "~/admin/constants/folders";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { useAdminPageBuilder } from "~/admin/hooks/useAdminPageBuilder";
import { useLinks } from "@webiny/app-aco";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/get-pages");

const defaultLoading: Record<LoadingActions, boolean> = {
    INIT: true,
    LIST: false,
    LIST_MORE: false
};

const useGetPages = (links: LinkItem[], folderId = FOLDER_ID_DEFAULT) => {
    const client = useApolloClient();
    const { showSnackbar } = useSnackbar();
    const pageBuilder = useAdminPageBuilder();
    const { deleteLink } = useLinks(folderId);
    const [pages, setPages] = useState<PbPageDataLink[]>([]);
    const [loading, setLoading] = useState<Loading<LoadingActions>>(defaultLoading);
    const [times, setTimes] = useState<number>(0);

    const getPagesByLinks = (links: LinkItem[]): void => {
        if (links.length === 0) {
            // No need to fetch pages, just returning an empty array
            setPages([]);
        } else {
            const action = times > 0 ? "LIST_MORE" : "LIST";
            setLoading(prev => {
                return {
                    ...prev,
                    [action]: true
                };
            });

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
            )
                .then((data: PbPageDataLink[]) => {
                    setPages(data);
                    setTimes(prev => prev + 1);
                })
                .catch(error => {
                    // TODO: In case of errors, let's show a message to users. This could be refactored using Promise.allSettled()
                    showSnackbar(
                        t`Error while fetching pages ({error})" `({
                            error: error.message
                        })
                    );
                })
                .finally(() => {
                    setLoading(state => {
                        return {
                            ...state,
                            [action]: false
                        };
                    });
                });
        }

        setLoading(state => {
            return {
                ...state,
                INIT: false
            };
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
        getPagesByLinks(links);
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

    return { loading, pages };
};

export default useGetPages;
