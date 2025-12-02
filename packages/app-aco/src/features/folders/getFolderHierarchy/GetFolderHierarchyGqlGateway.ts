import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { WebinyError } from "@webiny/error";
import {
    GetFolderHierarchyGatewayParams,
    IGetFolderHierarchyGateway
} from "./IGetFolderHierarchyGateway";
import { AcoError, FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

interface GetFolderHierarchyResponseData {
    parents: FolderItem[];
    siblings: FolderItem[];
}

export interface GetFolderHierarchyResponse {
    aco: {
        getFolderHierarchy: {
            data: GetFolderHierarchyResponseData | null;
            error: AcoError | null;
        };
    };
}

export interface GetFolderHierarchyQueryVariables {
    type: string;
    id: string;
}

export const GET_FOLDER_HIERARCHY = (FOLDER_FIELDS: string) => gql`
    query GetFolderHierarchy($type: String!, $id: ID!) {
        aco {
            getFolderHierarchy(type: $type, id: $id) {
                data {
                    parents ${FOLDER_FIELDS}
                    siblings ${FOLDER_FIELDS}
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export class GetFolderHierarchyGqlGateway implements IGetFolderHierarchyGateway {
    private client: ApolloClient<any>;
    private modelFields: string;

    constructor(client: ApolloClient<any>, modelFields: string) {
        this.client = client;
        this.modelFields = modelFields;
    }

    async execute(params: GetFolderHierarchyGatewayParams) {
        const { data: response } = await this.client.query<
            GetFolderHierarchyResponse,
            GetFolderHierarchyQueryVariables
        >({
            query: GET_FOLDER_HIERARCHY(this.modelFields),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error(
                `Network error while listing folder hierarchy for the provided type/id: ${params.type}/${params.id}.`
            );
        }

        const { data, error } = response.aco.getFolderHierarchy;

        if (!data) {
            throw new WebinyError({
                message:
                    error?.message ||
                    `Could not fetch folder hierarchy for the provided type/id: ${params.type}/${params.id}.`,
                code: "FOLDER_NOT_FOUND"
            });
        }

        return {
            parents: [this.getRootFolder(), ...data.parents],
            siblings: data.siblings
        };
    }

    private getRootFolder(): FolderItem {
        return {
            id: ROOT_FOLDER,
            title: "Home",
            permissions: [],
            parentId: "0",
            path: ROOT_FOLDER,
            slug: "",
            createdOn: "",
            createdBy: {
                id: "",
                displayName: "",
                type: ""
            },
            hasNonInheritedPermissions: false,
            canManagePermissions: true,
            canManageStructure: true,
            canManageContent: true,
            savedOn: "",
            savedBy: {
                id: "",
                displayName: "",
                type: ""
            },
            modifiedOn: null,
            modifiedBy: null,
            type: "$ROOT",
            extensions: {}
        };
    }
}
