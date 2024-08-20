import { PbContext } from "~/types";
import { GetModel } from "~/translations/useCases/getModel";
import { Language, LanguageFields } from "~/translations/domain/Language";

export interface IListLanguages {
    execute(): Promise<Language[]>;
}

export class ListLanguages implements IListLanguages {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute() {
        const model = await GetModel.byModelId(this.context, "translationLanguage");
        const [languages] = await this.context.cms.listLatestEntries<LanguageFields>(model, {
            limit: 1000
        });

        return languages.map(entry => Language.fromEntry(entry));
    }
}
