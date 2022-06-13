import { RenderEvent } from "~/types";

export const getIsNotFoundPage = (args: RenderEvent): boolean => {
    if (!Array.isArray(args.tags)) {
        return false;
    }

    return Boolean(args.tags.find(tag => tag.key === "notFoundPage" && tag.value === true));
};
