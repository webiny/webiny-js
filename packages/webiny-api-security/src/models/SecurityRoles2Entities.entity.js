// @flow
import compose from "lodash/fp/compose";
import { withName } from "@commodo/name";
import { ref } from "@commodo/fields-storage-ref";
import { withFields, string } from "@commodo/fields";

export default ({ Model, getModel }: Object) =>
    compose(
        withFields({
            entity: ref({ instanceOf: [], refNameField: "entityClassId" }),
            entityClassId: string(),
            role: ref({ instanceOf: getModel("Role") })
        }),
        withName("SecurityRole")
    )(Model);
