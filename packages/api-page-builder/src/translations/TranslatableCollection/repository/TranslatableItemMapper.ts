import { TranslatableItemDTO } from "~/translations/types";
import { TranslatableItem } from "~/translations/TranslatableCollection/TranslatableItem";

export class TranslatableItemMapper {
    static fromDTO(dto: TranslatableItemDTO) {
        return new TranslatableItem(
            dto.itemId,
            dto.value,
            dto.modifiedOn ? new Date(dto.modifiedOn) : new Date()
        );
    }

    static toDTO(item: TranslatableItem): TranslatableItemDTO {
        return {
            itemId: item.itemId,
            value: item.value,
            modifiedOn: item.modifiedOn.toISOString()
        };
    }
}
