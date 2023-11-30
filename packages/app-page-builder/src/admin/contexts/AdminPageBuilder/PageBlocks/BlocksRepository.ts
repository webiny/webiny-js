import { makeAutoObservable, runInAction } from "mobx";
import { plugins } from "@webiny/plugins";
import { Loading } from "./Loading";
import { BlockGatewayInterface } from "./BlockGatewayInterface";
import { PbEditorBlockPlugin, PbPageBlock } from "~/types";
import { getDefaultBlockContent } from "./defaultBlockContent";
import { addElementId } from "~/editor/helpers";
import { createBlockPlugin } from "./createBlockPlugin";

export class BlocksRepository {
    private gateway: BlockGatewayInterface;
    private loading: Loading;
    private pageBlocks: PbPageBlock[];
    private listOperation: Promise<any> | undefined = undefined;

    constructor(gateway: BlockGatewayInterface) {
        this.gateway = gateway;
        this.loading = new Loading();
        this.pageBlocks = [];
        makeAutoObservable(this);
    }

    getPageBlocks() {
        return this.pageBlocks;
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading,
            loadingLabel: this.loading.loadingLabel,
            message: this.loading.feedback
        };
    }

    private async runWithLoading<T>(
        action: () => Promise<T>,
        loadingLabel?: string,
        successMessage?: string,
        failureMessage?: string
    ) {
        return await this.loading.runCallbackWithLoading(
            action,
            loadingLabel,
            successMessage,
            failureMessage
        );
    }

    async listPageBlocks(): Promise<PbPageBlock[]> {
        if (this.pageBlocks.length > 0) {
            return this.pageBlocks;
        }

        if (this.listOperation) {
            return this.listOperation;
        }

        return (this.listOperation = (async () => {
            const pageBlocks = await this.runWithLoading<PbPageBlock[]>(
                () => this.gateway.list(),
                "Loading page blocks"
            );

            if (!pageBlocks) {
                return [];
            }

            const processedBlocks = await Promise.all(
                pageBlocks.map(pageBlock => this.processBlockFromApi(pageBlock))
            );

            runInAction(() => {
                this.pageBlocks = processedBlocks;
            });

            return this.pageBlocks;
        })());
    }

    async getById(id: string): Promise<PbPageBlock> {
        const blockInCache = this.pageBlocks.find(pb => pb.id === id);

        if (blockInCache) {
            return structuredClone(blockInCache);
        }

        const pageBlock = await this.runWithLoading<PbPageBlock>(async () => {
            const block = await this.gateway.getById(id);
            return this.processBlockFromApi(block);
        });

        runInAction(() => {
            this.pageBlocks = [...this.pageBlocks, pageBlock];
        });

        return structuredClone(pageBlock);
    }

    async refetchById(id: string): Promise<PbPageBlock> {
        const pageBlock = await this.runWithLoading<PbPageBlock>(async () => {
            const block = await this.gateway.getById(id);
            return this.processBlockFromApi(block);
        });

        runInAction(() => {
            const blockIndex = this.pageBlocks.findIndex(pb => pb.id === id);
            if (blockIndex > -1) {
                this.pageBlocks = this.pageBlocks.splice(blockIndex, 1, pageBlock);
            } else {
                this.pageBlocks = [...this.pageBlocks, pageBlock];
            }
        });

        return structuredClone(pageBlock);
    }

    async createPageBlock(input: { name: string; category: string; content?: unknown }) {
        const pageBlock = await this.runWithLoading(
            () => {
                return this.gateway.create({
                    name: input.name,
                    blockCategory: input.category,
                    content: input.content ?? getDefaultBlockContent()
                });
            },
            "Creating page block",
            `Page block "${input.name}" was created successfully.`
        );

        const processedBlock = this.processBlockFromApi(pageBlock);

        runInAction(() => {
            this.pageBlocks = [...this.pageBlocks, processedBlock];
        });

        return processedBlock;
    }

    async updatePageBlock(pageBlock: {
        id: string;
        name?: string;
        category?: string;
        content?: unknown;
    }) {
        const block = await this.getById(pageBlock.id);

        if (!block) {
            return;
        }

        const updatePageBlock: PbPageBlock = {
            ...block,
            name: pageBlock.name ?? block.name,
            blockCategory: pageBlock.category ?? block.blockCategory,
            content: addElementId(pageBlock.content ?? block.content)
        };

        await this.runWithLoading(
            () => {
                return this.gateway.update({
                    id: updatePageBlock.id,
                    name: updatePageBlock.name,
                    content: updatePageBlock.content,
                    blockCategory: updatePageBlock.blockCategory
                });
            },
            "Updating page block",
            `Filter "${updatePageBlock.name}" was updated successfully.`
        );

        runInAction(() => {
            const index = this.pageBlocks.findIndex(pb => pb.id === block.id);
            this.pageBlocks = [
                ...this.pageBlocks.slice(0, index),
                {
                    ...this.pageBlocks[index],
                    ...updatePageBlock
                },
                ...this.pageBlocks.slice(index + 1)
            ];
        });

        this.createBlockPlugin(updatePageBlock);
    }

    async deletePageBlock(id: string): Promise<void> {
        const block = await this.getById(id);

        if (!block) {
            return;
        }

        await this.runWithLoading(
            () => this.gateway.delete(id),
            "Deleting page block",
            `Filter "${block.name}" was deleted successfully.`
        );

        runInAction(() => {
            this.pageBlocks = this.pageBlocks.filter(block => block.id !== id);
        });

        this.removeBlockPlugin(block);
    }

    private processBlockFromApi(pageBlock: PbPageBlock) {
        const withElementIds = { ...pageBlock, content: addElementId(pageBlock.content) };
        this.createBlockPlugin(withElementIds);
        return withElementIds;
    }

    /**
     * TODO: the following two methods are a quick fix for the current way of rendering of blocks in the `SearchBlocks`
     * component. I'm not entirely sure why we need to use block plugins there, and I believe it can be simplified.
     *
     * Instead of converting all blocks into plugins, it might be more efficient to read plugins and assign block
     * definitions into this repository, and simplify the way blocks are rendered.
     */
    private createBlockPlugin(block: PbPageBlock) {
        // This will create a new or replace a previously registered block plugin.
        createBlockPlugin(block);
    }

    private removeBlockPlugin(block: PbPageBlock) {
        const blockPlugins = plugins.byType<PbEditorBlockPlugin>("pb-editor-block");
        const pluginToRemove = blockPlugins.find(pl => pl.id === block.id);
        if (pluginToRemove) {
            // Plugins fetched from the plugin registry will always have a `name`, so it is safe to cast.
            plugins.unregister(pluginToRemove.name as string);
        }
    }
}
