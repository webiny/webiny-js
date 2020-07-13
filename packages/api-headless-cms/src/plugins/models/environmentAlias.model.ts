import { validation } from "@webiny/validation";
import withChangedOnFields from "./withChangedOnFields";
import {
    pipe,
    withFields,
    setOnce,
    string,
    ref,
    withName,
    withHooks,
    withProps,
    onSet
} from "@webiny/commodo";
import toSlug from "../../utils/toSlug";

export default ({ createBase, context }) => {
    const CmsEnvironmentAlias = pipe(
        withName("CmsEnvironmentAlias"),
        withChangedOnFields(),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
            slug: pipe(
                setOnce(),
                onSet(val => toSlug(val))
            )(string({ validation: validation.create("required,maxLength:100") })),
            description: string({ validation: validation.create("maxLength:200") }),
            environment: ref({
                instanceOf: context.models.CmsEnvironment
            })
        })),
        withHooks({
            beforeDelete() {
                if (this.isProduction) {
                    throw new Error(`Cannot delete "production" environment alias.`);
                }
            },
            async beforeCreate() {
                const existingGroup = await CmsEnvironmentAlias.count({
                    query: { slug: this.slug }
                });
                if (existingGroup > 0) {
                    throw Error(`Environment alias with the slug "${this.slug}" already exists.`);
                }
            },
            async beforeSave() {
                if (await this.getField("environment").isDirty()) {
                    this.changedOn = new Date();
                }
            }
        }),
        withProps({
            get url() {
                const slug = this.slug;
                return {
                    manage: `/cms/manage/${slug}`,
                    read: `/cms/read/${slug}`,
                    preview: `/cms/preview/${slug}`
                };
            },
            get isProduction() {
                return this.slug === "production";
            }
        })
    )(createBase());

    return CmsEnvironmentAlias;
};
