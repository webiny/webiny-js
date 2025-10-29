import React from "react";
import { Loader } from "@webiny/app-aco";
import { Empty } from "./Empty.js";
import { FilterSelect } from "./FilterSelect.js";
import { FilterStatus } from "./FilterStatus.js";
import { Tags } from "./Tags.js";

import type { TagItem } from "@webiny/app-aco/types.js";

interface TagListProps {
    loading: boolean;
    onActivatedTagsChange: (tags: string[]) => void;
    tags: TagItem[];
    activeTags: string[];
    emptyDisclaimer?: string;
}

export const TagsList = ({
    loading,
    tags,
    emptyDisclaimer,
    onActivatedTagsChange,
    activeTags
}: TagListProps) => {
    if (loading) {
        return <Loader />;
    }

    return (
        <div className={"my-lg px-md"}>
            {tags.length === 0 ? (
                <Empty disclaimer={emptyDisclaimer} />
            ) : (
                <>
                    {tags.length > 1 && <FilterSelect />}
                    <FilterStatus
                        activeTags={activeTags}
                        onActivatedTagsChange={onActivatedTagsChange}
                    />
                    <Tags
                        tags={tags}
                        activeTags={activeTags}
                        onActivatedTagsChange={onActivatedTagsChange}
                    />
                </>
            )}
        </div>
    );
};
