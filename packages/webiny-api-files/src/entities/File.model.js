// @flow
import compose from "lodash/fp/compose";
import { validation } from "webiny-validation";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { withFields, onSet, number, string } from "@commodo/fields";

export const File = compose(
    withHooks({
        async beforeCreate() {
            if (!this.src.startsWith("/") || this.src.startsWith("http")) {
                throw Error(
                    `File "src" must be a relative path, starting with forward slash ("/").`
                );
            }

            if (await this.getModel("File").findOne({ query: { src: this.src } })) {
                throw Error(`File "src" must be unique. `);
            }
        }
    }),
    withFields({
        size: number({ validation: validation.create("required") }),
        type: string({ validation: validation.create("required,maxLength:50") }),
        src: string({ validation: validation.create("required,maxLength:200") }),
        name: string({ validation: validation.create("required,maxLength:100") }),
        tags: onSet(value => {
            if (value) {
                return value.map(item => item.toLowerCase());
            }

            return value;
        })(
            string({
                list: true,
                validation: tags => {
                    if (Array.isArray(tags)) {
                        if (tags.length > 15) {
                            throw Error("You cannot set more than 15 tags.");
                        }

                        for (let i = 0; i < tags.length; i++) {
                            let tag = tags[i];
                            if (typeof tag !== "string") {
                                throw Error("Tag must be typeof string.");
                            }

                            if (tag.length > 50) {
                                throw Error(`Tag ${tag} is more than 50 characters long.`);
                            }
                        }
                    }
                }
            })
        )
    }),
    withName("File")
)(function() {});
