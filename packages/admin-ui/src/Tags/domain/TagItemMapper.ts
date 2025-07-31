import type { TagItem } from "./TagItem";
import type { TagItemFormatted } from "./TagItemFormatted";

export class TagItemMapper {
    static toFormatted(item: TagItem): TagItemFormatted {
        return {
            id: item.id,
            label: item.label,
            protected: item.protected
        };
    }
}
