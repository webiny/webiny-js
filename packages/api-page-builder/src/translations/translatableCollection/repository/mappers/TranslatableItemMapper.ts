import { TranslatableItem } from "~/translations/translatableCollection/domain/TranslatableItem";
import { TranslatableItemDTO } from "~/translations/translatableCollection/repository/mappers/TranslatableItemDTO";

export class TranslatableItemMapper {
    static fromDTO(dto: TranslatableItemDTO) {
        return TranslatableItem.create({
            itemId: dto.itemId,
            value: dto.value,
            context: dto.context,
            modifiedOn: dto.modifiedOn ? new Date(dto.modifiedOn) : new Date(),
            modifiedBy: dto.modifiedBy
        });
    }

    static toDTO(item: TranslatableItem): TranslatableItemDTO {
        return {
            itemId: item.itemId,
            value: item.value,
            context: item.context,
            modifiedOn: item.modifiedOn.toISOString(),
            modifiedBy: item.modifiedBy
        };
    }
}
