import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import renderPage from "./renderPage";
import path from "path";
import { Page } from "./types";
import S3 from "aws-sdk/clients/s3";

const s3 = new S3({ region: process.env.AWS_REGION });

export default (): HandlerPlugin<
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

        const promises = [];
        for (let i = 0; i < args.pages.length; i++) {
            const page = args.pages[i];
            promises.push(
                new Promise(async resolve => {
                    const files = await renderPage(page);
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
                            contentType: file.type
                        });
                    }
                    resolve();
                })
            );
        }

        await Promise.all(promises);
    }
});

const storeFile = ({ key, contentType, body }) => {
    const Bucket = "some-bucket";
    return s3
        .putObject({
            Bucket,
            Key: key,
            ContentType: contentType,
            Body: body
        })
        .promise();
};
