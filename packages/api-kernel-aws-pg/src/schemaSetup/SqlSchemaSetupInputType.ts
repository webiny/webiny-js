import { InputType } from "@webiny/kernel-core";
import type { IInputType } from "@webiny/kernel-core";
import {
    SQL_SCHEMA_SETUP_EVENT_IDENTIFIER,
    SqlSchemaSetupInputHandler,
    type ISqlSchemaSetupEvent
} from "./abstractions.js";

/** Recognizes the schema-setup event and routes it to `SqlSchemaSetupInputHandler`. */
class SqlSchemaSetupInputTypeImpl implements IInputType<ISqlSchemaSetupEvent> {
    matches(input: any): input is ISqlSchemaSetupEvent {
        const payload = input?.[SQL_SCHEMA_SETUP_EVENT_IDENTIFIER];
        return typeof payload === "object" && payload !== null;
    }

    getHandlerAbstraction() {
        return SqlSchemaSetupInputHandler;
    }
}

export const SqlSchemaSetupInputType = InputType.createImplementation({
    implementation: SqlSchemaSetupInputTypeImpl,
    dependencies: []
});
