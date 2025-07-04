import { createFieldsList } from "@webiny/app-headless-cms-common";
import { usePageModel } from "~/features/pages/index.js";

export const useGetPageGraphQLSelection = () => {
    const model = usePageModel();

    if (!model) {
        throw Error(`useGetPageGraphQLSelection requires an PageModelContext to be available!`);
    }

    const fields = createFieldsList({ model, fields: model.fields });

    return /* GraphQL */ `{
        id
        entryId
        status
        version
        wbyAco_location {
            folderId
        }
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
        ${fields}
    }`;
};
