// @flow
import { flow } from "lodash";
import {
    withFields,
    onSet,
    setOnce,
    object,
    number,
    string,
    withName,
    withProps
} from "@webiny/commodo";

import { withAggregate } from "@commodo/fields-storage-mongodb";
import { validation } from "@webiny/validation";

export default ({ createBase, context }) => {
    const File = flow(
        withAggregate(),
        withName("File"),
        withProps({
            get src() {
                const settings = context.files.getSettings();
                return settings.data.srcPrefix + this.key;
            }
        }),
        withFields({
            key: setOnce()(string({ validation: validation.create("required,maxLength:200") })),
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
    )(createBase());

    return File;
};
