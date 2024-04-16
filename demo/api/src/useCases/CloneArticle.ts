import { CmsEntry } from "@webiny/api-headless-cms/types";
import Error from "@webiny/error";
import { Context } from "../types";

export interface CloneArticleParams {
    id: string;
    language: string;
}

export interface ICloneArticleUseCase {
    execute(params: CloneArticleParams): Promise<CmsEntry>;
}

export class CloneArticle implements ICloneArticleUseCase {
    private context: Context;
    constructor(context: Context) {
        this.context = context;
    }

    async execute({ id, language }: CloneArticleParams) {
        const model = await this.getArticleModel();
        const originalEntry = await this.context.cms.getEntryById(model, id);

        // `translationBase` links related articles.
        const translationBase = {
            modelId: "article",
            id: id
        };

        if (originalEntry.values["translationBase"]) {
            try {
                const originalBase = await this.context.cms.getEntryById(
                    model,
                    originalEntry.values["translationBase"].id
                );
                translationBase.id = originalBase.id;
            } catch {
                // Existing translation base no longer exists. Continue with the current `translationBase`.
            }
        }

        const input = {
            ...originalEntry.values,
            language: {
                modelId: "language",
                id: language
            },
            translationBase
        };

        return this.context.cms.createEntry(model, input);
    }

    private async getArticleModel() {
        const model = await this.context.cms.getModel("article");

        if (!model) {
            throw new Error(`Model "article" was not found!`);
        }

        return model;
    }
}
