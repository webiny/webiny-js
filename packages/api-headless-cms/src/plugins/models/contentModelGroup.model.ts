import { validation } from "@webiny/validation";
import {
    compose,
    withProps,
    withFields,
    setOnce,
    string,
    withName,
    withHooks
} from "@webiny/commodo";

export default ({ createBase, context }) => {
    const CmsGroup: any = compose(
        withName("CmsContentModelGroup"),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string(),
            icon: string({ validation: validation.create("required") })
        }),
        withProps({
            get contentModels() {
                return new Promise(async resolve => {
                    const { CmsContentModel } = context.models;
                    resolve(await CmsContentModel.find({ query: { group: this.id } }));
                });
            },
            get totalContentModels() {
                return new Promise(async resolve => {
                    const { CmsContentModel } = context.models;
                    resolve(await CmsContentModel.count({ query: { group: this.id } }));
                });
            }
        }),
        withHooks({
            async beforeDelete() {
                if (await this.totalContentModels > 0) {
                    throw new Error("Cannot delete this group because there are models that belong to it.")
                }
            },
            async beforeCreate() {
                const existingGroup = await CmsGroup.findOne({ query: { slug: this.slug } });
                if (existingGroup) {
                    throw Error(`Group with slug "${this.slug}" already exists.`);
                }
            }
        })
    )(createBase());

    return CmsGroup;
};
