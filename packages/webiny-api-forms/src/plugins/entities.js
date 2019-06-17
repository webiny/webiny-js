// @flow
import { type EntityPluginType } from "webiny-api/types";
import { formEntity, formSubmissionEntity } from "webiny-api-forms/entities";

export default ([
    {
        name: "entity-forms-form",
        type: "entity",
        entity: formEntity
    },
    {
        name: "entity-forms-form-submission",
        type: "entity",
        entity: formSubmissionEntity
    }
]: Array<EntityPluginType>);
