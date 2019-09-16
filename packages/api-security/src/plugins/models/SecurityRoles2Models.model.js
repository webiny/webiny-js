// @flow
import { flow } from "lodash";
import { withFields } from "@commodo/fields";
import { string } from "@commodo/fields/fields";
import { ref } from "@commodo/fields-storage-ref";
import { withName } from "@commodo/name";
import withStorage from "./withStorage";

export default config => ({ getModel }) =>
    flow(
        withStorage(config),
        withName("SecurityRoles2Models"),
        withFields(() => ({
            entity: ref({ instanceOf: [], refNameField: "entityClassId" }),
            entityClassId: string(),
            role: ref({
                instanceOf: getModel("SecurityRole")
            })
        }))
    )();
