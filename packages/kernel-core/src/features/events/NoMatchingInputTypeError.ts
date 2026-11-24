import type { InputType } from "./InputType.js";
import { EventShape } from "./EventShape.js";

/*
 * Name each registered type by the handler abstraction it dispatches to, NOT by `constructor.name`:
 * the production bundle minifies class names, so every entry came back as "implementation", useless
 * in exactly the place this message matters. An abstraction's name is a string literal, so it
 * survives bundling.
 */
function nameInputTypes(inputTypes: InputType.Interface[]): string[] {
    return inputTypes.map(inputType => {
        try {
            const abstraction = inputType.getHandlerAbstraction();
            return String(abstraction);
        } catch {
            return "<unknown>";
        }
    });
}

/**
 * No registered input type matches the incoming input. The message gives the input's shape and
 * the registered input types, so a misrouted invocation can be debugged from the log alone.
 */
export class NoMatchingInputTypeError extends Error {
    constructor(input: unknown, inputTypes: InputType.Interface[]) {
        const shape = EventShape.from(input);
        const registered = nameInputTypes(inputTypes);
        const registeredList = JSON.stringify(registered);
        const message = `No input type matched the incoming input. Input shape: ${shape}; registered input types: ${registeredList}`;

        super(message);
        this.name = "NoMatchingInputTypeError";
    }
}
