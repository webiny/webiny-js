// Load the TaskController augmentation (from @webiny/background-tasks) so consumers importing
// TaskDefinition here get the FULL controller interface — `controller.response`, `.state`,
// `.logger`, `.runtime`. Those members are added to api-core's TaskController via a `declare module`
// augmentation that lives in @webiny/background-tasks; without this side-effect import, code that
// imports TaskDefinition from `webiny/api/tasks` (e.g. task extensions) sees the bare controller and
// fails with "Property 'response' does not exist".
import "@webiny/background-tasks/api/global.js";

export { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
export { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
