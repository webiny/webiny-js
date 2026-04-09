import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, GraphQLError, NetworkError } from "../../errors.js";

export interface Language {
    id: string;
    code: string;
    name: string;
    direction?: "ltr" | "rtl";
    isDefault?: boolean;
    enabled?: boolean;
}

export async function listLanguages(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<Language[], HttpError | GraphQLError | NetworkError>> {
    const { executeGraphQL } = await import("../executeGraphQL.js");

    const query = `
        query ListLanguages {
            languages {
                listLanguages {
                    data {
                        id
                        code
                        name
                        direction
                        isDefault
                        enabled
                    }
                    error {
                        code
                        message
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

    if (responseData.languages.listLanguages.error) {
        const { GraphQLError } = await import("../../errors.js");
        return Result.fail(
            new GraphQLError(
                responseData.languages.listLanguages.error.message,
                responseData.languages.listLanguages.error.code
            )
        );
    }

    return Result.ok(responseData.languages.listLanguages.data);
}
