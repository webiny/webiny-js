import { CmsEditorContentEntry, CmsModel } from "~/types";

interface CmsEntry extends Pick<CmsEditorContentEntry, "id" | "title" | "status"> {
    model: Pick<CmsModel, "modelId" | "name">;
}
interface Options {
    (item: CmsEntry): Record<string, string>;
}
export const getOptions = (entries: CmsEntry[] = [], extraOptions: Options = null) => {
    return entries
        .map(item => {
            const name = item.title;

            if (!name) {
                return null;
            }

            const extraData = typeof extraOptions === "function" ? extraOptions(item) : {};

            return {
                id: item.id,
                modelId: item.model.modelId,
                modelName: item.model.name,
                name: name,
                published: item.status === "published",
                ...extraData
            };
        })
        .filter(Boolean);
};
