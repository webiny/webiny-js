import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { Language } from "~/translations/languages/domain/Language";
import { CmsLanguageMapper } from "./CmsLanguageMapper";
import type { CmsLanguageDTO } from "./CmsLanguageDTO";

export class ListLanguagesRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(): Promise<Language[]> {
        const model = await GetModel.byModelId(this.context, "translationLanguage");
        const [languages] = await this.context.cms.listLatestEntries<CmsLanguageDTO>(model, {
            limit: 1000
        });

        return languages.map(entry => CmsLanguageMapper.fromDTO(entry.values, entry.entryId));
    }
}
