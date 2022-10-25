import { useContext, useEffect } from "react";
import { LinksContext } from "~/contexts/links";
import { LinkItem } from "~/types";

export const useLinks = (folderId: string) => {
    const context = useContext(LinksContext);
    if (!context) {
        throw new Error("useFoldersLinks must be used within a FoldersProvider");
    }

    useEffect(() => {
        /**
         * On first mount, call `listLinks`, which will either issue a network request, or load links from cache.
         * We don't need to store the result of it to any local state; that is managed by the context provider.
         */
        context.listLinks(folderId);
    }, []);

    return {
        /**
         * NOTE: do NOT expose listLinks from this hook, because you already have folders in the `links` property.
         * You'll never need to call `listLinks` from any component. As soon as you call `useLinks()`, you'll initiate
         * fetching of `links`, which is managed by the LinksContext.
         */
        loading: context.loading,
        links: context.links,
        getLink(id: string) {
            return context.getLink(id);
        },
        createLink(link: Omit<LinkItem, "linkId">) {
            return context.createLink(link);
        },
        updateLink(link: LinkItem) {
            return context.updateLink(link, folderId);
        },
        deleteLink(link: LinkItem) {
            return context.deleteLink(link);
        }
    };
};
