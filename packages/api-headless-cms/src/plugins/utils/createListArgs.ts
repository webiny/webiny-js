import {CmsModel, CmsModelField} from "@webiny/api-headless-cms/types";

interface CreateListArgs {
    (params: { model: CmsModel; field: CmsModelField }): string;
}

export const createListArgs: CreateListArgs = () => {
    return /* GraphQL */ `(
        locale: String
        page: Int
        perPage: Int
        where: JSON
        sort: JSON
    )`;
};
