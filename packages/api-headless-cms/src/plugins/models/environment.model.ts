import { validation } from "@webiny/validation";
import { pipe, withFields, withProps, string, ref, withName, withHooks } from "@webiny/commodo";
import withChangedOnFields from "./withChangedOnFields";
import { CmsContext } from "../../types";

export default ({ createBase, context }: { createBase: Function; context: CmsContext }) => {
    return pipe(
        withName("CmsEnvironment"),
        withChangedOnFields(),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
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
            }
        }),
        withHooks({
            async beforeCreate() {
                if (!this.initial) {
                    if (!(await this.createdFrom)) {
                        throw new Error('Base environment ("createdFrom" field) not set.');
                    }
                }
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
};
