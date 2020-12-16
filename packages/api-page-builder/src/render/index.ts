import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import renderPage from "./renderPage";
import path from "path";
import S3 from "aws-sdk/clients/s3";
import { DbContext } from "@webiny/handler-db/types";
import defaults from "@webiny/api-page-builder/utils/defaults";

const s3 = new S3({ region: process.env.AWS_REGION });

export type Page = {
    path: string;
    tenant: string;
    locale: string;
};

export type Configuration = {
    storageName: string;
};

export default (
    configuration: Configuration
): HandlerPlugin<
    DbContext,
    ArgsContext<{
        pages: Page[];
    }>
> => ({
    type: "handler",
    async handle(context) {
        const { invocationArgs: args, db } = context;
        if (!Array.isArray(args.pages)) {
            return;
        }

        const { storageName } = configuration;

        const __settings = {};
        const getSettings = async (tenant, locale) => {
            const PK = `T#${tenant}#L#${locale}#PB#SETTINGS`;

            if (PK in __settings) {
                return __settings[PK];
            }

            __settings[PK] = await db.read({
                ...defaults.db,
                query: { PK, SK: "default" }
            });

            return __settings[PK];
        };

        const promises = [];
        for (let i = 0; i < args.pages.length; i++) {
            const page = args.pages[i];
            const settings = await getSettings(page.tenant, page.locale);

            promises.push(
                new Promise(async resolve => {
                    const files = await renderPage(settings.domain + page.path);
                    for (let j = 0; j < files.length; j++) {
                        const file = files[j];

                        const key = path.join(
                            "__PB__",
                            page.tenant,
                            page.locale,
                            page.path,
                            file.name
                        );

                        await storeFile({
                            key,
                            body: file.body,
                            contentType: file.type,
                            storageName
                        });
                    }
                    resolve();
                })
            );
        }

        await Promise.all(promises);
    }
});

const storeFile = ({ key, contentType, body, storageName }) => {
    return s3
        .putObject({
            Bucket: storageName,
            Key: key,
            ContentType: contentType,
            Body: body
        })
        .promise();
};
