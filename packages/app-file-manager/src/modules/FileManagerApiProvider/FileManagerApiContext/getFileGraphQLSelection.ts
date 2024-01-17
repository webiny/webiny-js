import { createFieldsList } from "@webiny/app-headless-cms-common";
import { useFileModel } from "~/hooks/useFileModel";

export const getFileGraphQLSelection = (model: ReturnType<typeof useFileModel>) => {
    const fields = createFieldsList({ model, fields: model.fields });
    return /* GraphQL */ `{
        __typename
        id
        createdOn
        savedOn
        createdBy {
            id
            displayName
        }
        src
        ${fields}
    }`;
};
