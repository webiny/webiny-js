import type { WebinyConfig } from "../../types.js";
import { Result } from "../../Result.js";
import type { HttpError, NetworkError } from "../../errors.js";
import { executeGraphQL } from "../executeGraphQL.js";
import { ApiError } from "../../errors.js";

export interface Language {
    id: string;
    code: string;
    name: string;
    direction?: "ltr" | "rtl";
    isDefault?: boolean;
}

export async function listLanguages(
    config: WebinyConfig,
    fetchFn: typeof fetch
): Promise<Result<Language[], HttpError | ApiError | NetworkError>> {
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
        return Result.fail(
            new ApiError(
                responseData.languages.listLanguages.error.message,
                responseData.languages.listLanguages.error.code
            )
        );
    }

    return Result.ok(responseData.languages.listLanguages.data);
}
