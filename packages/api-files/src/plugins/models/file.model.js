// @flow
import { flow } from "lodash";
import { withFields, onSet, object, number, string, withName, withHooks } from "@webiny/commodo";
import { withAggregate } from "@commodo/fields-storage-mongodb";
import { validation } from "@webiny/validation";

export default ({ createBase }) => {
    const File = flow(
        withAggregate(),
        withName("File"),
        withFields({
            src: string({ validation: validation.create("required,maxLength:200") }),
            size: number(),
            type: string({ validation: validation.create("maxLength:50") }),
            name: string({ validation: validation.create("maxLength:100") }),
            meta: object(),
            tags: onSet(value => {
                if (!Array.isArray(value)) {
                    return null;
                }

                return value.map(item => item.toLowerCase());
            })(
                string({
                    list: true,
                    validation: tags => {
                        if (!Array.isArray(tags)) {
                            return;
                        }

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
                })
            )
        }),
        withHooks({
            async beforeCreate() {
                if (!this.src.startsWith("/") || this.src.startsWith("http")) {
                    throw Error(
                        `File "src" must be a relative path, starting with forward slash ("/").`
                    );
                }

                if (await File.findOne({ query: { src: this.src } })) {
                    throw Error(`File "src" must be unique (used "${this.src}").`);
                }
            }
        })
    )(createBase());

    return File;
};
