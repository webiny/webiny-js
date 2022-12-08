import { useContext, useEffect, useMemo } from "react";
import { LinksContext } from "~/contexts/links";
import { LinkItem } from "~/types";

export const useLinks = (folderId: string) => {
    const context = useContext(LinksContext);

    if (!context) {
        throw new Error("useFoldersLinks must be used within a FoldersProvider");
    }

    const { links, loading, meta, listLinks, getLink, createLink, updateLink, deleteLink } =
        context;

    useEffect(() => {
        /**
         * On first mount, call `listLinks`, which will either issue a network request, or load links from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        listLinks(folderId);
    }, [folderId]);

    return useMemo(
        () => ({
            /**
             * NOTE: you do NOT need to call `listLinks` from this hook on component mount, because you already have folders in the `links` property.
             * As soon as you call `useLinks()`, you'll initiate fetching of `links`, which is managed by the `LinksContext`.
             * Sinceince this method lists links with pagination, you might need to call it multiple times passing the `after` param.
             */
            loading: loading[folderId] || {},
            meta: meta[folderId] || {},
            links: links.filter(link => link.folderId === folderId),
            listLinks(after: string, limit?: number) {
                return listLinks(folderId, limit, after);
            },
            getLink(id: string) {
                return getLink(id, folderId);
            },
            createLink(link: Omit<LinkItem, "linkId">) {
                return createLink(link);
            },
            updateLink(link: LinkItem) {
                return updateLink(link, folderId);
            },
            deleteLink(link: LinkItem) {
                return deleteLink(link);
            }
        }),
        [links, loading, meta]
    );
};
