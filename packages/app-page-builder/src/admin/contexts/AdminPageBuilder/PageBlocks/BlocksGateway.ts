import { ApolloClient } from "apollo-client";
import {
    CREATE_PAGE_BLOCK,
    CreatePageBlockMutationResponse,
    CreatePageBlockMutationVariables,
    DELETE_PAGE_BLOCK,
    DeletePageBlockMutationResponse,
    DeletePageBlockMutationVariables,
    GET_PAGE_BLOCK,
    GetPageBlockQueryResponse,
    GetPageBlockQueryVariables,
    LIST_PAGE_BLOCKS,
    ListPageBlocksQueryResponse,
    ListPageBlocksQueryVariables,
    UPDATE_PAGE_BLOCK,
    UpdatePageBlockMutationResponse,
    UpdatePageBlockMutationVariables
} from "~/admin/views/PageBlocks/graphql";
import { PbPageBlock } from "~/types";
import {
    BlockGatewayInterface,
    CreatePageBlockInput,
    UpdatePageBlockInput
} from "./BlockGatewayInterface";
import { decompress } from "~/admin/components/useDecompress";

export class BlocksGateway implements BlockGatewayInterface {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async list() {
        const { data: response } = await this.client.query<
            ListPageBlocksQueryResponse,
            ListPageBlocksQueryVariables
        >({
            query: LIST_PAGE_BLOCKS,
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing filters.");
        }

        const { data, error } = response.pageBuilder.listPageBlocks;

        if (!data) {
            throw new Error(error?.message || "Could not fetch filters.");
        }

        return data.map(block => this.decompressContent(block));
    }

    async create(pageBlock: CreatePageBlockInput): Promise<PbPageBlock> {
        const { data: response } = await this.client.mutate<
            CreatePageBlockMutationResponse,
            CreatePageBlockMutationVariables
        >({
            mutation: CREATE_PAGE_BLOCK,
            variables: {
                data: pageBlock
            }
        });

        if (!response) {
            throw new Error("Network error while creating filter.");
        }

        const { data, error } = response.pageBuilder.pageBlock;

        if (!data) {
            throw new Error(error?.message || "Could not create filter.");
        }

        return this.decompressContent(data);
    }

    async delete(id: string): Promise<void> {
        const { data: response } = await this.client.mutate<
            DeletePageBlockMutationResponse,
            DeletePageBlockMutationVariables
        >({
            mutation: DELETE_PAGE_BLOCK,
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while deleting filter.");
        }

        const { data, error } = response.pageBuilder.deletePageBlock;

        if (!data) {
            throw new Error(error?.message || "Could not delete page block.");
        }
    }

    async getById(id: string): Promise<PbPageBlock> {
        const { data: response } = await this.client.query<
            GetPageBlockQueryResponse,
            GetPageBlockQueryVariables
        >({
            query: GET_PAGE_BLOCK,
            variables: { id },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetching page block.");
        }

        const { data, error } = response.pageBuilder.getPageBlock;

        if (!data) {
            throw new Error(error?.message || `Could not fetch page block with id: ${id}`);
        }

        return this.decompressContent(data);
    }

    async update({ id, ...pageBlock }: UpdatePageBlockInput) {
        if (!id) {
            throw new Error("Error while updating page block: missing `id`.");
        }

        const { data: response } = await this.client.mutate<
            UpdatePageBlockMutationResponse,
            UpdatePageBlockMutationVariables
        >({
            mutation: UPDATE_PAGE_BLOCK,
            variables: {
                id,
                data: pageBlock
            }
        });

        if (!response) {
            throw new Error("Network error while updating filter.");
        }

        const { data, error } = response.pageBuilder.pageBlock;

        if (!data) {
            throw new Error(error?.message || "Could not update filter.");
        }
    }

    private decompressContent(pageBlock: PbPageBlock) {
        return {
            ...pageBlock,
            content: decompress(pageBlock.content)
        };
    }
}
