import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";
import type { TaskDefinition } from "./taskTypes.js";

export async function listDefinitions(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<TaskDefinition[], HttpError | GraphQLError | NetworkError>> {
    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query ListTaskDefinitions {
            backgroundTasks {
                listDefinitions {
                    data {
                        id
                        title
                        description
                    }
                    error {
                        message
                        code
                    }
                }
            }
        }
    `;

    const result = await executeGraphQL(config, fetchFn, query, {});

    if (result.isFail()) {
        return Result.fail(result.error);
    }

    const responseData = result.value;

    if (responseData.backgroundTasks.listDefinitions.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.backgroundTasks.listDefinitions.error.message,
                responseData.backgroundTasks.listDefinitions.error.code
            )
        );
    }

    return Result.ok(responseData.backgroundTasks.listDefinitions.data);
}
