import { flow } from "lodash";
import { withFields, withHooks, boolean } from "@webiny/commodo";

export default () =>
    flow(
        withFields({ latestVersion: boolean() }),
        withHooks({
            async beforeCreate() {
                this.latestVersion = true;

                if (this.version > 1) {
                    const removeCallback = this.hook("afterCreate", async () => {
                        const previousLatestForm = await this.constructor.findOne({
                            query: {
                                parent: this.parent,
                                latestVersion: true,
                                version: { $ne: this.version }
                            }
                        });

                        if (previousLatestForm) {
                            previousLatestForm.latestVersion = false;
                            await previousLatestForm.save();
                        }
                        removeCallback();
                    });
                }
            },
            async beforeDelete() {
                // If parent is being deleted, do not do anything. Both parent and children will be deleted anyways.
                if (this.id === this.parent) {
                    return;
                }

                if (this.version > 1 && this.latestVersion) {
                    this.latestVersion = false;
                    const removeCallback = this.hook("afterDelete", async () => {
                        const previousLatestForm = await this.constructor.findOne({
                            query: {
                                parent: this.parent
                            },
                            sort: {
                                version: -1
                            }
                        });
                        previousLatestForm.latestVersion = true;
                        await previousLatestForm.save();

                        removeCallback();
                    });
                }
            }
        })
    );
