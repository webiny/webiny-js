import { validation } from "@webiny/validation";
import { compose, withFields, setOnce, string, withName } from "@webiny/commodo";

export default ({ createBase, context }) => {
    const CmsGroup: any = compose(
        withName(`CmsContentModelGroup`),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string({ validation: validation.create("maxLength:200") }),
            icon: string({ validation: validation.create("required") }),
            environment: setOnce()(context.commodo.fields.id())
        })
    )(createBase());

    return CmsGroup;
};
