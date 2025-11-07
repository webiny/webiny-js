import gql from "graphql-tag";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { ICmsEntryRevisionSimple, IGenericError } from "../../types.js";

export interface IListCmsRevisionsVariables {
    revisions: string[];
}

export interface IListCmsRevisionsResponse {
    entries: {
        data: ICmsEntryRevisionSimple[] | null;
        error: IGenericError | null;
    };
}

export const createContentEntriesGraphQL = (model: Pick<CmsModel, "pluralApiName">) => {
    return gql`
        query ListCmsRevisions($revisions: [ID!]!) {
            entries: get${model.pluralApiName}ByIds(revisions: $revisions) {
                data {
                    id
                    wbyAco_location {
                        folderId
                    }
                }
            }
        }
    `;
};
