import { validation } from "@webiny/validation";
import {
    pipe,
    withFields,
    withProps,
    string,
    ref,
    withName,
    withHooks,
    setOnce
} from "@webiny/commodo";
import withChangedOnFields from "./withChangedOnFields";
import { CmsContext } from "../../types";
import shortid from "shortid";
import toSlug from "@webiny/api-headless-cms/utils/toSlug";

export default ({ createBase, context }: { createBase: Function; context: CmsContext }) => {
    const CmsEnvironment = pipe(
        withName("CmsEnvironment"),
        withChangedOnFields(),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
            slug: setOnce()(string()),
            description: string({ validation: validation.create("maxLength:200") }),
            createdFrom: ref({
                instanceOf: context.models.CmsEnvironment
            })
        })),
        withProps({
            initial: false, // Set in the installation process in order to create the initial environment.
            get environmentAlias() {
                const { CmsEnvironmentAlias } = context.models;
                return CmsEnvironmentAlias.findOne({
                    query: { environment: this.id }
                });
            },
            get isProduction() {
                return this.environmentAlias.then(environmentAlias => {
                    return environmentAlias && environmentAlias.isProduction === true;
                });
            },
            get contentModels() {
                // TODO [Andrei] [now]: CmsContentModel comes from /content, so we need to load those models here...
                //  can I just import the plugin?
                const { CmsContentModel } = context.models;

                console.log(context.models);
                console.log(CmsContentModel);
                console.log(CmsContentModel.find({}));

                return CmsContentModel.find({});
                // return CmsContentModel.find({ environment: this.id });
            }
        }),
        withHooks({
            async beforeCreate() {
                if (!this.initial) {
                    if (!(await this.createdFrom)) {
                        throw new Error('Base environment ("createdFrom" field) not set.');
                    }
                }

                // If there is a slug assigned, check if it's unique ...
                if (this.slug) {
                    const existingGroup = await CmsEnvironment.findOne({
                        query: { slug: this.slug }
                    });
                    if (existingGroup) {
                        throw Error(`Environment with slug "${this.slug}" already exists.`);
                    }
                    return;
                }

                // ... otherwise, assign a unique slug automatically.
                this.slug = toSlug(this.name);
                const existingGroup = await CmsEnvironment.findOne({ query: { slug: this.slug } });
                if (!existingGroup) {
                    return;
                }

                this.getField("slug").state.set = false;
                this.slug = `${this.slug}-${shortid.generate()}`;
            },
            async afterCreate() {
                const sourceEnvironment = await this.createdFrom;
                if (sourceEnvironment) {
                    await context.cms.dataManager.copyEnvironment({
                        copyFrom: sourceEnvironment.id,
                        copyTo: this.id
                    });
                }
            },
            async beforeDelete() {
                const environmentAlias = await this.environmentAlias;
                if (environmentAlias) {
                    throw new Error(
                        `Cannot delete the environment because it's currently linked to the "${environmentAlias.name}" environment alias.`
                    );
                }
            },
            async afterChange() {
                const environmentAlias = await this.environmentAlias;
                if (environmentAlias) {
                    environmentAlias.changedOn = new Date();
                    await environmentAlias.save();
                }
            },
            async afterDelete() {
                await context.cms.dataManager.deleteEnvironment({ environment: this.id });
            }
        })
    )(createBase());

    return CmsEnvironment;
};
