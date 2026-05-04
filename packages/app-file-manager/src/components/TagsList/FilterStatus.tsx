import React, { useCallback } from "react";
import { Button, Text } from "@webiny/admin-ui";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

interface FilterStatusProps {
    activeTags: string[];
    onActivatedTagsChange: (tags: string[]) => void;
}

export const FilterStatus = ({ activeTags, onActivatedTagsChange }: FilterStatusProps) => {
    const { actions } = useFileManagerPresenter();

    const resetTags = useCallback(() => {
        onActivatedTagsChange([]);
        actions.filter.clear("tags_rule");
    }, []);

    return (
        <div className={"mb-md flex items-center justify-between gap-sm"}>
            <Text size={"sm"} className={"text-neutral-muted"}>
                {activeTags.length} selected
            </Text>
            <Button
                onClick={resetTags}
                size={"sm"}
                variant={"ghost"}
                text={"Reset"}
                disabled={activeTags.length === 0}
            />
        </div>
    );
};
