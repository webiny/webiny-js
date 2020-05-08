import i18n from "./i18n";
import { ContextI18NGetLocales } from "@webiny/api-i18n/types";
import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";

let localesCache;

export default options => [
    i18n,
    {
        name: "context-i18n-get-locales",
        type: "context-i18n-get-locales",
        async resolve() {
            if (Array.isArray(localesCache)) {
                return localesCache;
            }

            const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
            const { Payload } = await Lambda.invoke({
                FunctionName: options.localesFunction
            }).promise();

            let parsedPayload;

            try {
                parsedPayload = JSON.parse(Payload as string);
            } catch (e) {
                throw new Error("Could not JSON.parse DB Proxy's response.");
            }

            localesCache = parsedPayload;
            return localesCache;
        }
    } as ContextI18NGetLocales<Context>
];
