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

    }>
> => ({
    type: "handler",
    async handle(context) {
        const { invocationArgs: args, db } = context;
        if (!Array.isArray(args.paths)) {
            return;
        }

        const { storageName } = configuration;

        const __settings = {};
        const getSettings = async (tenant, locale) => {
            // T#root#L#en-US#PB#SETTINGS
            const PK = `T#${tenant}#L#${locale}#PB#SETTINGS`;

            if (PK in __settings) {
                return __settings[PK];
            }

            const [[settings]] = await db.read({
                ...defaults.db,
                query: { PK, SK: "default" },
                limit: 1
            });

            __settings[PK] = settings;
            return __settings[PK];
        };

        const promises = [];
        for (let i = 0; i < args.paths.length; i++) {
            const current = args.paths[i];
            const settings = await getSettings(current.tenant, current.locale);

            promises.push(
                new Promise(async resolve => {
                    const files = await renderPage(settings.websiteUrl + current.path);
                    for (let j = 0; j < files.length; j++) {
                        const file = files[j];

                        const key = path.join(
                            current.tenant,
                            current.locale,
                            current.path,
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

        return {};
    }
});

const storeFile = ({ key, contentType, body, storageName }) => {
    return s3
        .putObject({
            Bucket: storageName,
            Key: key,
            ACL: "public-read",
            ContentType: contentType,
            Body: body
        })
        .promise();
};
