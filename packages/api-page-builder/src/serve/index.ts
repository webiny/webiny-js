import { HandlerPlugin, Context } from "@webiny/handler/types";
import S3 from "aws-sdk/clients/s3";
import { ArgsContext } from "@webiny/handler-args/types";
import Error from "@webiny/error";
import { DbContext } from "@webiny/handler-db/types";
import { join } from "path";
import { HttpRequestObject } from "@webiny/handler-http/types";

export type Tag = { id?: string; class?: string };
export type Args = {
    httpRequest?: HttpRequestObject;
    tenant?: string;
    locale?: string;
    path?: string;
};

export type Configuration = {
    storageName: string;
};

export type Response = {
    error: {
        code: string;
        data: Record<string, any>;
        message: string;
    };
    code: number;
    content: {
        body: string;
        type: string;
    };
};

type HandlerContext = Context<DbContext, ArgsContext<Args>>;

export default (configuration: Configuration): HandlerPlugin<HandlerContext> => ({
    type: "handler",
    async handle(context): Promise<string> {
        const { tenant, locale, path } = await getTenantLocalePath(context);
        const { storageName } = configuration;

        try {
            const key = getFileKey(tenant, locale, path);
            let object = await getObject(key, storageName);
            if (object) {
                return response({
                    error: null,
                    code: 200,
                    content: {
                        body: object.Body.toString(),
                        type: object.ContentType
                    }
                });
            }

            object = await getNotFoundPage(tenant, locale, storageName);
            if (object) {
                return response({
                    error: null,
                    code: 404,
                    content: {
                        body: object.Body.toString(),
                        type: object.ContentType
                    }
                });
            }

            object = await getErrorPage(tenant, locale, storageName);
            if (object) {
                return response({
                    error: null,
                    code: 500,
                    content: {
                        body: object.Body.toString(),
                        type: object.ContentType
                    }
                });
            }

            throw new Error(
                `An error occurred while trying to serve "${path}".`,
                "COULD_NOT_SERVE_FILE",
                {
                    data: {
                        args: context.invocationArgs
                    }
                }
            );
        } catch (e) {
            return response({
                error: {
                    code: e.code,
                    message: e.message,
                    data: e.data
                },
                code: 500,
                content: null
            });
        }
    }
});

const response = (response: Response): string => JSON.stringify(response);

const s3 = new S3({ region: process.env.AWS_REGION });

const getFileKey = (tenant, locale, path) => {
    return join("__PB__", tenant, locale, path);
};

const getObject = (key, storageName) => {
    return s3
        .getObject({
            Bucket: storageName,
            Key: key
        })
        .promise();
};

const getErrorPage = (tenant, locale, storageName) => {
    const key = getFileKey(tenant, locale, "__error__/index.html");
    return getObject(key, storageName);
};

const getNotFoundPage = (tenant, locale, storageName) => {
    const key = getFileKey(tenant, locale, "__404__/index.html");
    return getObject(key, storageName);
};

const getTenantLocalePath = async (
    context: HandlerContext
): Promise<{ tenant: string; locale: string; path: string }> => {
    const { httpRequest, tenant, locale, path } = context.invocationArgs;
    if (tenant && locale && path) {
        return { tenant, locale, path };
    }

    if (httpRequest) {
        /*const settings = await context.db.read({
            query: {
                PK: "PB#DOMAIN#TENANT",
                SK: httpRequest.path.base
            }
        });*/

        const tenant = "root";
        const locale = "en-US";
        const path = "/";
        return { tenant, locale, path };
    }

    throw new Error(
        `An error occurred while trying to serve "${path}".`,
        "COULD_NOT_DETECT_TENANT_LOCALE_PATH",
        {
            data: {
                args: context.invocationArgs
            }
        }
    );
};
