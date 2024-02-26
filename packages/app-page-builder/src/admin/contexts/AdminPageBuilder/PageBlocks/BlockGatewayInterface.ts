import { PbPageBlock } from "~/types";

export type CreatePageBlockInput = Pick<PbPageBlock, "name" | "blockCategory" | "content">;
export type UpdatePageBlockInput = Pick<PbPageBlock, "id"> & CreatePageBlockInput;

export interface BlockGatewayInterface {
    list(): Promise<PbPageBlock[]>;
    getById(id: string): Promise<PbPageBlock>;
    create(pageBlock: CreatePageBlockInput): Promise<PbPageBlock>;
    update(pageBlock: UpdatePageBlockInput): Promise<void>;
    delete(id: string): Promise<void>;
}
