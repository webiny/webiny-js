import { pipe, withFields, withStaticProps, setOnce, withHooks } from "@webiny/commodo";
import { cloneDeep } from "lodash";

const modifyQueryArgs = (args = {}, environment) => {
    const returnArgs: any = cloneDeep(args);
    if (returnArgs.query) {
        returnArgs.query = {
            $and: [{ environment: environment.id }, returnArgs.query]
        };
    } else {
        returnArgs.query = { environment: environment.id };
    }

    return returnArgs;
};

export const createEnvironmentBase = ({ context, addEnvironmentField }) => () => {
    const environment = context.cms.getEnvironment();

    const base = pipe(
        withStaticProps(({ find, count, findOne }) => ({
            find(args) {
                return find.call(this, modifyQueryArgs(args, environment));
            },
            count(args) {
                return count.call(this, modifyQueryArgs(args, environment));
            },
            findOne(args) {
                return findOne.call(this, modifyQueryArgs(args, environment));
            }
        }))
    )(context.models.createBase());

    if (!(addEnvironmentField === false)) {
        pipe(
            withFields({
                environment: setOnce()(context.commodo.fields.id())
            }),
            withHooks({
                beforeCreate() {
                    if (!this.environment) {
                        this.environment = environment.id;
                    }
                }
            })
        )(base);
    }

    return base;
};
