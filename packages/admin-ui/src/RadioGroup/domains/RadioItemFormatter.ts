import type { RadioItemFormatted } from "./RadioItemFormatted.js";
import type { RadioItem } from "./RadioItem.js";

export class RadioItemFormatter {
    static format(item: RadioItem): RadioItemFormatted {
        return {
            id: item.id,
            label: item.label,
            value: String(item.value),
            disabled: item.disabled,
            description: item.description
        };
    }
}
