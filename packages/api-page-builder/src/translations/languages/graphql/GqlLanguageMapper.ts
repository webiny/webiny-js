import { Language } from "~/translations/languages/domain/Language";
import { GqlLanguageDTO } from "~/translations/languages/graphql/GqlLanguageDTO";

export class GqlLanguageMapper {
    static toDTO(language: Language): GqlLanguageDTO {
        return {
            id: language.getId(),
            name: language.getName(),
            code: language.getCode(),
            direction: language.getDirection(),
            isBaseLanguage: language.isBaseLanguage()
        };
    }
}
