import upperFirst from "lodash/upperFirst";
import gql from "graphql-tag";

export const createRepublishMutation = model => {
    const ucFirstModelId = upperFirst(model.modelId);

    return gql`
        mutation CmsRepublish${ucFirstModelId}($revision: ID!) {
            content: republish${ucFirstModelId}(revision: $revision) {
            data {
                id
            }
            error {
                message
                data
                code
            }
        }
    }`;
};
