import React, { ReactNode, useCallback, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { ApolloQueryResult } from "apollo-client/core/types";
import { FetchResult } from "apollo-link";

import { CREATE_LINK, DELETE_LINK, GET_LINK, LIST_LINKS, UPDATE_LINK } from "~/graphql/links.gql";

import {
    CreateLinkResponse,
    CreateLinkVariables,
    DeleteLinkResponse,
    DeleteLinkVariables,
    GetLinkQueryVariables,
    GetLinkResponse,
    LinkItem,
    LinkLoadingActions,
    ListLinksQueryVariables,
    ListLinksResponse,
    UpdateLinkResponse,
    UpdateLinkVariables
} from "~/types";

const loadingDefault = {
    LIST_LINKS: false,
    GET_LINK: false,
    CREATE_LINK: false,
    UPDATE_LINK: false,
    DELETE_LINK: false
};

interface LinksContext {
    links: LinkItem[];
    loading: Record<LinkLoadingActions, boolean>;
    listLinks: (type: string) => Promise<LinkItem[]>;
    getLink: (id: string) => Promise<LinkItem>;
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
    const [loading, setLoading] = useState<Record<LinkLoadingActions, boolean>>(loadingDefault);

    const apolloActionsWrapper = useCallback(
        async (
            type: LinkLoadingActions,
            callback: () => Promise<ApolloQueryResult<any> | FetchResult<any>>
        ) => {
            setLoading({
                ...loading,
                [type]: true
            });

            const response = await callback();

            setLoading({
                ...loading,
                [type]: false
            });

            return response;
        },
        []
    );

    const context: LinksContext = {
        links,
        loading,
        async listLinks(folderId: string) {
            if (!folderId) {
                throw new Error("Link `folderId` is mandatory");
            }

            const { data: response } = await apolloActionsWrapper("LIST_LINKS", () =>
                client.query<ListLinksResponse, ListLinksQueryVariables>({
                    query: LIST_LINKS,
                    variables: { folderId }
                })
            );

            const { data, error } = response.folders.listLinks;

            if (!data) {
                throw new Error(error?.message || "Could not fetch links");
            }

            setLinks([...new Set([...links, ...data])]);

            return data;
        },

        async getLink(id) {
            if (!id) {
                throw new Error("Link `id` is mandatory");
            }

            const { data: response } = await apolloActionsWrapper("GET_LINK", () =>
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
            const { data: response } = await apolloActionsWrapper("CREATE_LINK", () =>
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

            return data;
        },

        async updateLink(link, contextFolderId) {
            const { id, folderId } = link;

            const { data: response } = await apolloActionsWrapper("UPDATE_LINK", () =>
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
            const { id } = link;

            const { data: response } = await apolloActionsWrapper("DELETE_LINK", () =>
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

            return true;
        }
    };

    return <LinksContext.Provider value={context}>{children}</LinksContext.Provider>;
};
