import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";

interface CreateListArgs {
    (params: { model: CmsModel; field: CmsModelField }): string;
}

export const createListArgs: CreateListArgs = ({ field }) => {
    const localeArg = field.localization ? "locale: String" : "";
    const typeName = createTypeName(field.settings.modelId);
    const rTypeName = createReadTypeName(typeName);

    return /* GraphQL */ `(
        ${localeArg}
        page: Int
        perPage: Int
        where: ${rTypeName}ListWhereInput
        sort: [${rTypeName}ListSorter]
    )`;
};
