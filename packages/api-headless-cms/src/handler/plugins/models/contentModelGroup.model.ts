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

import slugify from "slugify";
import shortid from "shortid";

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

export default ({ createBase, context }) => {
    const CmsGroup: any = compose(
        withName(`CmsContentModelGroup`),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string({ validation: validation.create("maxLength:200") }),
            icon: string({ validation: validation.create("required") })
        }),
        withProps({
            get contentModels() {
                const { CmsContentModel } = context.models;
                return CmsContentModel.find({ query: { group: this.id } });
            },
            get totalContentModels() {
                const { CmsContentModel } = context.models;
                return CmsContentModel.count({ query: { group: this.id } });
            }
        }),
        withHooks({
            async beforeDelete() {
                const totalContentModels = await this.totalContentModels;
                if (totalContentModels > 0) {
                    throw new Error(
                        "Cannot delete this group because there are models that belong to it."
                    );
                }
            },
            async beforeCreate() {
                // If there is a slug assigned, check if it's unique ...
                if (this.slug) {
                    const existingGroup = await CmsGroup.findOne({ query: { slug: this.slug } });
                    if (existingGroup) {
                        throw Error(`Group with slug "${this.slug}" already exists.`);
                    }
                    return;
                }

                // ... otherwise, assign a unique slug automatically.
                this.slug = toSlug(this.name);
                const existingGroup = await CmsGroup.findOne({ query: { slug: this.slug } });
                if (!existingGroup) {
                    return;
                }

                this.getField("slug").state.set = false;
                this.slug = `${this.slug}-${shortid.generate()}`;
            },
            async beforeSave() {
                if (this.isDirty()) {
                    const removeCallback = this.hook("afterSave", async () => {
                        removeCallback();
                        const environment = context.cms.getEnvironment();
                        environment.changedOn = new Date();
                        await environment.save();
                    });
                }
            }
        })
    )(createBase());

    return CmsGroup;
};
