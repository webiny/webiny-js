import type { ToggleItemFormatted } from "./ToggleItemFormatted.js";
import type { ToggleItem } from "./ToggleItem.js";

export class ToggleItemMapper {
    static toFormatted(item: ToggleItem): ToggleItemFormatted {
        return {
            id: item.id,
            label: item.label,
            value: item.value,
            checked: item.checked,
            disabled: item.disabled,
            icon: item.icon,
            iconPosition: item.iconPosition
        };
    }
}
