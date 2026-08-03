import { ErrorResponse, Response } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { TasksCrud } from "@webiny/background-tasks/api/TasksCrud.js";
import { ThemePermissions } from "@webiny/api-theme/features/permissions/abstractions.js";
import { extractionTypeDefs } from "./extraction.typeDefs.js";
import {
    THEME_EXTRACTION_TASK_ID,
    type IThemeExtractionTaskInput,
    type IThemeExtractionTaskOutput
} from "~/features/extract/ThemeExtractionTask.js";
import { ExtractionInvalidUrlError } from "~/features/shared/errors.js";
import { normaliseUrl } from "~/crawl/urlScoring.js";

/**
 * Resolvers are thin: authorize, delegate, map onto the `{ data, error }` envelope — the same shape as
 * the rest of the theme API.
 */

interface ExtractArgs {
    data: {
        url: string;
        name: string;
        crawlLimit?: number;
        force?: boolean;
    };
}

/**
 * Correlation id for one run.
 *
 * Not the task id: the websocket messages start flowing before `trigger` returns, so the client needs an
 * id it was given up front. Randomness only has to avoid collision between concurrent runs, and there is
 * at most one of those per tenant.
 */
const createExtractionId = (): string => {
    return `ext-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const resolve = async (fn: () => Promise<unknown>) => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};

export const addExtractionSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(extractionTypeDefs);

    builder.addResolver({
        path: "ThemeMutation.extractTheme",
        dependencies: [TaskService, ThemePermissions],
        resolver(taskService: TaskService.Interface, permissions: ThemePermissions.Interface) {
            return ({ args }: { args: ExtractArgs }) =>
                resolve(async () => {
                    // Gated here as well as in `CreateThemeUseCase`. Without this, a user who cannot
                    // create themes would still spend a full crawl of somebody's website before being
                    // refused at the last step.
                    if (!(await permissions.canCreate("theme"))) {
                        throw new Error(
                            "You do not have permission to create themes, so extraction cannot run."
                        );
                    }

                    const name = args.data.name?.trim();
                    if (!name) {
                        throw new Error("The new theme needs a name.");
                    }

                    // Validated before triggering. A bad URL discovered inside the task costs the user a
                    // round trip through the queue to be told something we could see immediately.
                    const url = normaliseUrl(args.data.url, args.data.url);
                    if (!url) {
                        throw new ExtractionInvalidUrlError(args.data.url);
                    }

                    const extractionId = createExtractionId();

                    const result = await taskService.trigger<IThemeExtractionTaskInput>({
                        definition: THEME_EXTRACTION_TASK_ID,
                        name: `Theme from ${url}`,
                        input: {
                            extractionId,
                            entryUrl: url,
                            themeName: name,
                            crawlLimit: args.data.crawlLimit,
                            force: args.data.force
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return { taskId: result.value.id, extractionId };
                });
        }
    });

    builder.addResolver({
        path: "ThemeMutation.abortThemeExtraction",
        dependencies: [TaskService, ThemePermissions],
        resolver(taskService: TaskService.Interface, permissions: ThemePermissions.Interface) {
            return ({ args }: { args: { taskId: string } }) =>
                resolve(async () => {
                    if (!(await permissions.canCreate("theme"))) {
                        throw new Error("You do not have permission to manage theme extraction.");
                    }

                    const result = await taskService.abort({
                        id: args.taskId,
                        message: "Cancelled from the Admin app."
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    // The lock is released by the task's own `finally`, so nothing to undo here.
                    return { taskId: args.taskId, extractionId: "" };
                });
        }
    });

    builder.addResolver({
        path: "ThemeQuery.getThemeExtraction",
        dependencies: [TasksCrud, ThemePermissions],
        resolver(tasksCrud: TasksCrud.Interface, permissions: ThemePermissions.Interface) {
            return ({ args }: { args: { taskId: string } }) =>
                resolve(async () => {
                    // Gated on THEME permissions, not task permissions. Someone allowed to create themes
                    // should be able to see the progress of the one they started without also being
                    // granted access to every background task in the project.
                    if (!(await permissions.canCreate("theme"))) {
                        throw new Error("You do not have permission to view theme extraction.");
                    }

                    const task = await tasksCrud.getTask<
                        IThemeExtractionTaskInput,
                        IThemeExtractionTaskOutput
                    >(args.taskId);

                    if (!task) {
                        throw new Error(`No extraction was found with the id "${args.taskId}".`);
                    }

                    // Guarded because `getTask` will happily return any task; returning another
                    // feature's task through the theme API would be a small information leak and a
                    // confusing client bug.
                    if (task.definitionId !== THEME_EXTRACTION_TASK_ID) {
                        throw new Error(`"${args.taskId}" is not a theme extraction.`);
                    }

                    return {
                        taskId: task.id,
                        state: task.taskStatus,
                        themeId: task.output?.themeId ?? null,
                        entryUrl: task.output?.entryUrl ?? task.input?.entryUrl ?? null,
                        sampledUrls: task.output?.sampledUrls ?? null,
                        error: task.output?.error?.message ?? null
                    };
                });
        }
    });
};
