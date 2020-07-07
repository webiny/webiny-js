// @ts-ignore
import { withFields, withName, string, boolean, pipe, withProps, withHooks } from "@webiny/commodo";
import { validation } from "@webiny/validation";

/**
 * A simple "Entity" data model, that consists of a couple of simple fields.
 *
 * @see https://docs.webiny.com/docs/api-development/commodo/introduction
 * @see https://github.com/webiny/commodo/tree/master
 */
export default ({ createBase }) =>
    pipe(
        withName("Entity"),
        withFields(() => ({
            // A simple "string" field, with a couple of validators attached.
            title: string({ validation: validation.create("required,minLength:3,maxLength:100") }),

            // This field is not required.
            description: string({ validation: validation.create("maxLength:500") }),

            // A simple "boolean" field, with the default value set to "true".
            isNice: boolean({ value: true })
        })),
        withHooks({
            // We might want to do something before saving the data to a database.
            beforeSave() {
                if (this.isNice) {
                    // Maybe we would want to do something if "isNice" is true?
                }
            }
        }),
        withProps({
            // "withProps" allows us to define additional static and dynamic properties. Note that these
            // properties won't end up in your database, only fields in the "withFields({ ... })" will.
            get shortDescription() {
                return this.description ? this.description.substring(0, 100) + "..." : "";
            }
        })
    )(createBase());
