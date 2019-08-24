// @flow
import { type EntityPluginType } from "@webiny/api/types";
import { formEntity, formSubmissionEntity, formsSettingsEntity } from "@webiny/api-forms/entities";

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
    },
    {
        type: "entity",
        name: "entity-forms-settings",
        entity: formsSettingsEntity
    }
]: Array<EntityPluginType>);
