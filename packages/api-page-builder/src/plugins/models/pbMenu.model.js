// @flow
import { flow } from "lodash";
import { withFields, setOnce } from "@commodo/fields";
import { string } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { validation } from "@webiny/validation";
import { object } from "commodo-fields-object";
import { withHooks } from "@commodo/hooks";

export default ({ createBase }) => {
    const PbMenu = flow(
        withName("PbMenu"),
        withFields({
            title: string({ validation: validation.create("required") }),
            slug: setOnce()(string({ validation: validation.create("required") })),
            description: string(),
            items: object()
        }),
        withHooks({
            async beforeCreate() {
                const existingMenu = await PbMenu.findOne({ query: { slug: this.slug } });
                if (existingMenu) {
                    throw Error(`Menu with slug "${this.slug}" already exists.`);
                }
            }
        })
    )(createBase());

    return PbMenu;
};
