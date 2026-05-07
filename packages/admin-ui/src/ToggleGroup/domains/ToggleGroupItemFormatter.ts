import type { ToggleGroupItemFormatted } from "./ToggleGroupItemFormatted.js";
import type { ToggleGroupItem } from "./ToggleGroupItem.js";

export class ToggleGroupItemFormatter {
    static format(item: ToggleGroupItem): ToggleGroupItemFormatted {
        return {
            id: item.id,
            label: item.label,
            value: item.value,
            disabled: item.disabled,
            icon: item.icon,
            iconPosition: item.iconPosition
        };
    }
}
