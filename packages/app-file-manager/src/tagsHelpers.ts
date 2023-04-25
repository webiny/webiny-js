import { DEFAULT_SCOPE } from "~/constants";
import { TagItem } from "@webiny/app-aco/types";

export const getTagsInitialParams = (scope: string | undefined) => {
    if (!scope) {
        return {
            tags_not_startsWith: DEFAULT_SCOPE
        };
    } else {
        return {
            tags_startsWith: scope
        };
    }
};

export const tagsModifier = (scope?: string) => (tags: TagItem[]) => {
    const tagsWithoutMime = tags.filter(tag => !tag.name.startsWith("mime:"));
    if (scope) {
        return tagsWithoutMime;
    }

    return tagsWithoutMime
        .filter(tag => tag.name !== scope)
        .map(tag => {
            return scope
                ? {
                      ...tag,
                      name: tag.name.replace(`${scope}:`, "")
                  }
                : tag;
        });
};
