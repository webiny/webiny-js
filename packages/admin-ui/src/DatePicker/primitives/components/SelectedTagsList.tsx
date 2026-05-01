import React from "react";
import { Tag } from "~/Tag/index.js";

interface SelectedTagsListProps {
    items: Array<{ key: string; label: string }>;
    onRemove: (key: string) => void;
    disabled?: boolean;
}

const SelectedTagsList = ({ items, onRemove, disabled }: SelectedTagsListProps) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-xs pt-sm">
            {items.map(item => (
                <Tag
                    key={item.key}
                    content={item.label}
                    variant="neutral-light"
                    disabled={disabled}
                    onDismiss={() => onRemove(item.key)}
                />
            ))}
        </div>
    );
};

export { SelectedTagsList, type SelectedTagsListProps };
