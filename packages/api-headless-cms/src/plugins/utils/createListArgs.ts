import {CmsModel, CmsModelField} from "@webiny/api-headless-cms/types";

interface CreateListArgs {
    (params: { model: CmsModel; field: CmsModelField }): string;
}

export const createListArgs: CreateListArgs = () => {
    return /* GraphQL */ `(
        page: Int
        perPage: Int
        where: JSON
        sort: JSON
    )`;
};
