import { createFieldsList } from "@webiny/app-headless-cms-common";
import type { useFileModel } from "~/presentation/hooks/useFileModel.js";

export const getFileGraphQLSelection = (model: ReturnType<typeof useFileModel>) => {
    const fields = createFieldsList({ model, fields: model.fields });
    return /* GraphQL */ `{
        __typename
        id
        createdOn
        createdBy {
            id
            displayName
        }
        savedOn
        savedBy {
            id
            displayName
        }
        modifiedOn
        modifiedBy {
            id
            displayName
        }
        src
        location {
            folderId
        }
        ${fields}
    }`;
};
