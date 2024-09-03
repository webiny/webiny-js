import { Language } from "~/translations/languages/domain/Language";
import type { CmsLanguageDTO } from "./CmsLanguageDTO";

export class CmsLanguageMapper {
    static fromDTO(dto: CmsLanguageDTO, id?: string): Language {
        return new Language(
            {
                name: dto.name,
                code: dto.code,
                direction: dto.direction,
                isBaseLanguage: dto.baseLanguage
            },
            id
        );
    }

    static toDTO(language: Language): CmsLanguageDTO {
        return {
            name: language.getName(),
            code: language.getCode(),
            direction: language.getDirection(),
            baseLanguage: language.isBaseLanguage()
        };
    }
}
