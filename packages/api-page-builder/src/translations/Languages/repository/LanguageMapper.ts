import { Language } from "~/translations/Languages/Language";
import { LanguageDTO } from "~/translations/types";

export class LanguageMapper {
    static fromDTO(dto: LanguageDTO): Language {
        return new Language(dto.name, dto.code, dto.direction, dto.baseLanguage);
    }

    static toDTO(language: Language): LanguageDTO {
        return {
            name: language.name,
            code: language.code,
            direction: language.direction,
            baseLanguage: language.isBaseLanguage
        };
    }
}
