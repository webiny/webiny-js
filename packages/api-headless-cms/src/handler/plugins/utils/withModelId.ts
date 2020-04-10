import cloneDeep from "lodash.clonedeep";
import { pipe, withFields, setOnce, string, withStaticProps } from "@webiny/commodo";

export const withModelId = modelId => {
    const modifyQuery = (args = {}) => {
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

    return pipe(
        withFields({
            model: setOnce()(string({ value: modelId }))
        }),
        withStaticProps(({ find, count, findOne }) => ({
            find(args) {
                return find.call(this, modifyQuery(args));
            },
            count(args) {
                return count.call(this, modifyQuery(args));
            },
            findOne(args) {
                return findOne.call(this, modifyQuery(args));
            }
        }))
    );
};
