// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { validation } from "@webiny/validation";

export default ({ createBase }) =>
    flow(
        withName("PbCategory"),
        withFields({
            name: string({ validation: validation.create("required") }),
            slug: string({ validation: validation.create("required") }),
            url: string({ validation: validation.create("required") }),
            layout: string()
        })
    )(createBase());
