import { CmsEditorContentEntry, CmsModel } from "~/types";
import { OptionItem } from "./types";

interface CmsEntry extends Pick<CmsEditorContentEntry, "id" | "entryId" | "title" | "status"> {
    model: Pick<CmsModel, "modelId" | "name">;
}
interface Options {
    (item: CmsEntry): Record<string, string>;
}

export const getOptions = (entries: CmsEntry[] = [], extraOptions?: Options): OptionItem[] => {
    return entries
        .map(item => {
            const name = item.title;

            if (!name) {
                return null;
            }

            const extraData = typeof extraOptions === "function" ? extraOptions(item) : {};

            return {
                id: item.id,
                entryId: item.entryId,
                modelId: item.model.modelId,
                modelName: item.model.name,
                name: name,
                published: item.status === "published",
                status: item.status,
                ...extraData
            };
        })
        .filter(Boolean) as OptionItem[];
};
