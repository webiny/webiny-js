import gql from "graphql-tag";
import { CmsErrorResponse, CmsModel } from "~/types";

export interface ListReferencedModelsQueryResult {
    listContentModels: {
        data: Pick<CmsModel, "modelId" | "name">[];
        error: CmsErrorResponse | null;
    };
}
export const LIST_REFERENCED_MODELS = gql`
    query ListReferencedModels {
        listContentModels {
            data {
                modelId
                name
            }
            error {
                message
                data
                code
            }
        }
    }
`;
