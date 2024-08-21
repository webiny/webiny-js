import { PbContext } from "~/types";
import { GetModel } from "~/translations/GetModel";
import { LanguageDTO } from "~/translations/types";
import { LanguageMapper } from "~/translations/Languages/repository/LanguageMapper";
import { Language } from "~/translations/Languages/Language";

export class ListLanguagesRepository {
    private readonly context: PbContext;

    constructor(context: PbContext) {
        this.context = context;
    }

    async execute(): Promise<Language[]> {
        const model = await GetModel.byModelId(this.context, "translationLanguage");
        const [languages] = await this.context.cms.listLatestEntries<LanguageDTO>(model, {
            limit: 1000
        });

        return languages.map(entry => LanguageMapper.fromDTO(entry.values));
    }
}
