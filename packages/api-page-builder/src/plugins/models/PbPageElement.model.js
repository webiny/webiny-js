// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string } from "@commodo/fields/fields";
import { withName } from "@commodo/name";
import { validation } from "@webiny/validation";
import { id } from "@commodo/fields-storage-mongodb/fields";
import content from "./pbPage/contentField";

export default ({ createBase, context }) =>
    flow(
        withName("PbPageElement"),
        withFields({
            name: string({ validation: validation.create("required") }),
            category: string(),
            type: string({ validation: validation.create("required,in:element:block") }),
            content: content({ context }),
            preview: id()
        })
    )(createBase({ maxPerPage: 1000 }));
