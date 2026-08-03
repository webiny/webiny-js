/**
 * Pulls in the `TaskController` module augmentation.
 *
 * `@webiny/api-core` declares `ITaskController` as an empty interface and `@webiny/background-tasks`
 * augments it with the real surface — `response`, `state`, `logger`, `task`, `runtime`. Without this
 * side-effect import the augmentation is not in the compilation and every controller property looks
 * like it does not exist. Same pattern as `api-file-manager-s3` and `ai-powerups`.
 */
import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
