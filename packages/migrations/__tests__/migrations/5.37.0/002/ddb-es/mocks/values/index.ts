import { createTextValue } from "~tests/migrations/5.37.0/002/ddb-es/mocks/values/text";
import { createLongTextValue } from "~tests/migrations/5.37.0/002/ddb-es/mocks/values/longText";
import { createRichTextValue } from "~tests/migrations/5.37.0/002/ddb-es/mocks/values/richText";
import { createTimeValue } from "~tests/migrations/5.37.0/002/ddb-es/mocks/values/time";
import { createNumberValue } from "~tests/migrations/5.37.0/002/ddb-es/mocks/values/number";

export * from "./longText";
export * from "./number";
export * from "./richText";
export * from "./text";
export * from "./time";

export const createValues = (id: string) => {
    return {
        textField: createTextValue(id),
        longTextField: createLongTextValue(),
        richTextField: createRichTextValue(),
        dateTimeField: new Date().toISOString(),
        timeField: createTimeValue(),
        numberField: createNumberValue(),
        objectField: {
            textField: createTextValue(id),
            dateTimeField: new Date().toISOString(),
            timeField: createTimeValue(),
            numberField: createNumberValue(100000),
            longTextField: createLongTextValue(),
            richTextField: createRichTextValue()
        }
    };
};
