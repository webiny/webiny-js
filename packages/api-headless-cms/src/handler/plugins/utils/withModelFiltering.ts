import cloneDeep from "lodash.clonedeep";
import { pipe, withStaticProps } from "@webiny/commodo";

const modifyQuery = (modelId, args = {}) => {
    const returnArgs = cloneDeep(args);
    if (returnArgs.query) {
        returnArgs.query = {
            $and: [{ model: modelId }, returnArgs.query]
        };
    } else {
        returnArgs.query = { model: modelId };
    }

    return returnArgs;
};

// Applies proper "model" field filtering when doing basic "find", "count", and "findOne" querying.
// Note that it doesn't assign the "model" field itself, just because different models can have this
// field assigned in different ways. Check the following references for examples:
// - packages/api-headless-cms/src/handler/plugins/utils/createSearchModelFromData.ts:27
// - packages/api-headless-cms/src/handler/plugins/utils/createDataModelFromData.ts:177
export const withModelFiltering = modelId => {
    return pipe(
        withStaticProps(({ find, count, findOne }) => ({
            find(args) {
                return find.call(this, modifyQuery(modelId, args));
            },
            count(args) {
                return count.call(this, modifyQuery(modelId, args));
            },
            findOne(args) {
                return findOne.call(this, modifyQuery(modelId, args));
            }
        }))
    );
};
