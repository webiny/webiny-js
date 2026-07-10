import { createAbstraction } from "@webiny/feature/api";
import type { ITasksContextObject } from "~/api/types.js";

/**
 * At runtime this is the full tasks facade (CRUD + definition + service methods), assembled and
 * registered by BackgroundTasksFeature. Typed as the full `ITasksContextObject` so sibling calls
 * (e.g. `getDefinition`, `trigger`) type-check.
 */
export const TasksCrud = createAbstraction<ITasksContextObject>("Tasks/TasksCrud");

export namespace TasksCrud {
    export type Interface = ITasksContextObject;
}
