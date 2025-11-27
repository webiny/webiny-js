import type { SegmentedControlItemFormatted } from "./SegmentedControlItemFormatted.js";
import type { SegmentedControlItem } from "./SegmentedControlItem.js";

export class SegmentedControlItemFormatter {
    static format(item: SegmentedControlItem): SegmentedControlItemFormatted {
        return {
            id: item.id,
            label: item.label,
            value: String(item.value),
            disabled: item.disabled,
            icon: item.icon
        };
    }
}

