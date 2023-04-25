import { DEFAULT_SCOPE } from "~/constants";
import { TagItem } from "@webiny/app-aco/types";
import { useSecurity } from "@webiny/app-security";

interface GetTagsInitialParams {
    scope?: string;
    own?: boolean;
}

export const getTagsInitialParams = ({ scope, own }: GetTagsInitialParams) => {
    const { identity } = useSecurity();
    return {
        ...(own && { createdBy: identity?.id }),
        ...(scope ? { tags_startsWith: scope } : { tags_not_startsWith: DEFAULT_SCOPE })
    };
};

export const tagsModifier = (scope?: string) => (tags: TagItem[]) => {
    const tagsWithoutMimeAndScope = tags
        .filter(tag => tag.name !== scope)
        .filter(tag => !tag.name.startsWith("mime:"));

    return tagsWithoutMimeAndScope.map(tag => {
        return scope
            ? {
                  ...tag,
                  name: tag.name.replace(`${scope}:`, "")
              }
            : tag;
    });
};
