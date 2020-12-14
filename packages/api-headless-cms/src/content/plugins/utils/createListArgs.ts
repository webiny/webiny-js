import { CmsContentModelType } from "@webiny/api-headless-cms/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";

type CreateListArgsType = {
    model: CmsContentModelType;
    field: any;
};

export const createListArgs = ({ field }: CreateListArgsType): string => {
    const localeArg = "locale: String";
    const typeName = createTypeName(field.settings.modelId);
    const rTypeName = createReadTypeName(typeName);

    return /* GraphQL */ `(
        ${localeArg}
        where: ${rTypeName}ListWhereInput
        sort: [${rTypeName}ListSorter]
        limit: Int
        after: String
        before: String
    )`;
};
