import React, { ReactNode, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { apolloFetchingHandler, loadingHandler } from "~/handlers";

import { CREATE_LINK, DELETE_LINK, GET_LINK, LIST_LINKS, UPDATE_LINK } from "~/graphql/links.gql";

import {
    CreateLinkResponse,
    CreateLinkVariables,
    DeleteLinkResponse,
    DeleteLinkVariables,
    GetLinkQueryVariables,
    GetLinkResponse,
    LinkItem,
    LinksActions,
    ListLinksQueryVariables,
    ListLinksResponse,
    ListMeta,
    Loading,
    Meta,
    UpdateLinkResponse,
    UpdateLinkVariables
} from "~/types";

interface LinksContext {
    links: LinkItem[];
    loading: Loading<LinksActions>;
    meta: Meta<ListMeta>;
    listLinks: (type: string, limit?: number, after?: string) => Promise<LinkItem[]>;
    getLink: (id: string, folderId: string) => Promise<LinkItem>;
    createLink: (link: Omit<LinkItem, "linkId">) => Promise<LinkItem>;
    updateLink: (link: LinkItem, contextFolderId: string) => Promise<LinkItem>;
    deleteLink(link: LinkItem): Promise<true>;
}

export const LinksContext = React.createContext<LinksContext | undefined>(undefined);

interface Props {
    children: ReactNode;
}

export const LinksProvider = ({ children }: Props) => {
    const client = useApolloClient();
    const [links, setLinks] = useState<LinkItem[]>([]);
    const [loading, setLoading] = useState<Loading<LinksActions>>({});
    const [meta, setMeta] = useState<Meta<ListMeta>>({});

    const context: LinksContext = {
        links,
        loading,
        meta,
        async listLinks(folderId: string, limit = 10, after?: string) {
            if (!folderId) {
                throw new Error("Link `folderId` is mandatory");
            }

            const action = after ? "LIST_MORE_LINKS" : "LIST_LINKS";

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler(folderId, action, setLoading),
                () =>
                    client.query<ListLinksResponse, ListLinksQueryVariables>({
                        query: LIST_LINKS,
                        variables: { folderId, limit, after }
                    })
            );

            const { data, meta: responseMeta, error } = response.folders.listLinks;

            if (!data) {
                throw new Error(error?.message || "Could not fetch links");
            }

            setLinks(links => [...new Set([...links, ...data])]);

            setMeta(meta => ({
                ...meta,
                [folderId]: responseMeta
            }));

            return data;
        },

        async getLink(id, folderId) {
            if (!id) {
                throw new Error("Link `id` is mandatory");
            }

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler(folderId, "GET_LINK", setLoading),
                () =>
                    client.query<GetLinkResponse, GetLinkQueryVariables>({
                        query: GET_LINK,
                        variables: { id }
                    })
            );

            const { data, error } = response.folders.getLink;

            if (!data) {
                throw new Error(error?.message || `Could not fetch link with id: ${id}`);
            }

            return data;
        },

        async createLink(link) {
            const { folderId } = link;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler(folderId, "CREATE_LINK", setLoading),
                () =>
                    client.mutate<CreateLinkResponse, CreateLinkVariables>({
                        mutation: CREATE_LINK,
                        variables: { data: link }
                    })
            );

            if (!response) {
                throw new Error("Network error while creating link");
            }

            const { data, error } = response.folders.createLink;

            if (!data) {
                throw new Error(error?.message || "Could not create link");
            }

            setLinks(links => [...links, data]);

            setMeta(meta => ({
                ...meta,
                [folderId]: {
                    ...meta[folderId],
                    totalCount: ++meta[folderId].totalCount
                }
            }));

            return data;
        },

        async updateLink(link, contextFolderId) {
            const { id, folderId } = link;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler(folderId, "UPDATE_LINK", setLoading),
                () =>
                    client.mutate<UpdateLinkResponse, UpdateLinkVariables>({
                        mutation: UPDATE_LINK,
                        variables: { id, data: { folderId } }
                    })
            );

            if (!response) {
                throw new Error("Network error while updating link");
            }

            const { data, error } = response.folders.updateLink;

            if (!data) {
                throw new Error(error?.message || "Could not update link");
            }

            setLinks(links =>
                links
                    .map(link => (link.id === id ? data : link))
                    .filter(link => link.folderId === contextFolderId)
            );

            return data;
        },

        async deleteLink(link) {
            const { id, folderId } = link;

            const { data: response } = await apolloFetchingHandler(
                () => loadingHandler(folderId, "DELETE_LINK", setLoading),
                () =>
                    client.mutate<DeleteLinkResponse, DeleteLinkVariables>({
                        mutation: DELETE_LINK,
                        variables: { id }
                    })
            );

            if (!response) {
                throw new Error("Network error while deleting link");
            }

            const { data, error } = response.folders.deleteLink;

            if (!data) {
                throw new Error(error?.message || "Could not delete link");
            }

            setLinks(links => links.filter(link => link.id !== id));

            setMeta(meta => ({
                ...meta,
                [folderId]: {
                    ...meta[folderId],
                    totalCount: --meta[folderId].totalCount
                }
            }));

            return true;
        }
    };

    return <LinksContext.Provider value={context}>{children}</LinksContext.Provider>;
};
