import { TranslatedItemDTO } from "~/translations/translatedCollection/repository/mappers/TranslatedItemDTO";
import { TranslatedItem } from "~/translations/translatedCollection/domain/TranslatedItem";

export class TranslatedItemMapper {
    static fromDTO(dto: TranslatedItemDTO) {
        return TranslatedItem.create({
            itemId: dto.itemId,
            value: dto.value,
            translatedOn: dto.translatedOn ? new Date(dto.translatedOn) : undefined,
            translatedBy: dto.translatedBy
        });
    }

    static toDTO(item: TranslatedItem): TranslatedItemDTO {
        return {
            itemId: item.itemId,
            value: item.value,
            translatedOn: item.translatedOn?.toISOString(),
            translatedBy: item.translatedBy
        };
    }
}
