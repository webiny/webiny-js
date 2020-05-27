import { validation } from "@webiny/validation";
import withChangedOnFields from "./withChangedOnFields";
import {
    pipe,
    fields,
    withFields,
    setOnce,
    string,
    ref,
    withName,
    withHooks,
    withProps
} from "@webiny/commodo";

// id: ID
// name: String
// description: String
// token: String
// createdOn: DateTime

export default ({ createBase, context }) =>
    pipe(
        withName("CmsAccessToken"),
        withChangedOnFields(),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
            description: string({ validation: validation.create("required,maxLength:100") }),
            token: string({ validation: validation.create("required,maxLength:64") })
            // environmentAliases: fields({
            //     list: true,
            //     value: [],
            //     instanceOf: withFields({
            //         type: string({
            //             validation: validation.create("required,in:error:warning:info:success"),
            //             message: string(),
            //             data: object(),
            //             createdOn: date({ value: new Date() })
            //         })
            //     })()
            // })

            //   ref({
            //     instanceOf: context.models.CmsEnvironment
            // })
        })),
        withProps({
            // get environmentAliases() {
            //     const { CmsEnvironmentAlias } = context.models;
            //
            //     return ["alias 1", "alias 2", "..."];
            // },
            // get environments() {
            //     // return CmsEnvironmentAlias.findOne({
            //     //     query: { environment: this.id }
            //     // });
            //
            //     // return this.environmentAliases.then(environmentAlias => {
            //     //     return environmentAlias && environmentAlias.isProduction === true;
            //     // });
            //
            //     return ["env 1", "env 2", "..."];
            // }
        })
    )(createBase());
