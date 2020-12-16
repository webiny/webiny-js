import { HandlerPlugin } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import S3 from "aws-sdk/clients/s3";

export type Tag = { id?: string; class?: string };
export type Args = { tags?: Tag[]; path?: string; queue?: boolean; tenant: string; locale: string };

const s3 = new S3({ region: process.env.AWS_REGION });

const BUCKET = process.env.S3_BUCKET;

const getErrorPage = (tenant, locale) => {
    const object = s3
        .getObject({
            Bucket: BUCKET,
            Key: `prerender/${tenant}/${locale}/__error__/index.html`
        })
        .promise();

    return object;
};

const getNotFoundPage = (tenant, locale) => {
    const object = s3
        .getObject({
            Bucket: BUCKET,
            Key: `prerender/${tenant}/${locale}/__not-found__/index.html`
        })
        .promise();

    return object;
};

export default (): HandlerPlugin<HttpContext> => ({
    type: "handler",
    async handle(context, next) {
        const { invocationArgs } = context;

        const tenant = "root";
        const locale = "en-US";

        try {
            return getNotFoundPage(tenant, locale);
        } catch (e) {
            return `<html>Major error. 😤</html>`
        }
    }
});
