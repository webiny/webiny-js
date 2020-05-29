import { ContextPlugin } from "@webiny/graphql/types";
import models from "./models";
import modelFields from "./modelFields";
import filterOperators from "./filterOperators";
import graphqlFields from "./graphqlFields";
import graphql from "./graphql";
import { TypeValueEmitter } from "./utils/TypeValueEmitter";

type HeadlessPluginsOptions = {
    type: string;
    environment: string;
    dataManagerFunction?: string;
};

export default (
    options: HeadlessPluginsOptions = {
        type: null,
        environment: null,
        dataManagerFunction: null
    }
) => [
    {
        name: "context-cms-context",
        type: "context",
        apply(context) {
            context.cms = context.cms || {};
            context.cms.type = options.type || "read";
            context.cms.environment = options.environment;
            context.cms.dataManagerFunction = options.dataManagerFunction;

            context.cms.READ = options.type === "read";
            context.cms.PREVIEW = options.type === "preview";
            context.cms.MANAGE = options.type === "manage";

            if (!context.cms.MANAGE) {
                context.resolvedValues = new TypeValueEmitter();
            }
        }
    } as ContextPlugin,
    models(),
    {
        name: "context-cms-validate-access-token",
        type: "context",
        apply(context) {
            console.log("Going in the promise...");

            return new Promise(async (resolve, reject) => {
                console.log("Inside the promise...");
                try {
                    console.log("Trying...");
                    console.log(context);
                    if (context.event && (context.cms.READ || context.cms.PREVIEW)) {
                        // TODO refactor this: move context.event inside
                        console.log("1");
                        const accessToken = context.event.headers["access-token"];
                        console.log("2");
                        const { CmsAccessToken } = context.models;

                        console.log("3");
                        console.log(options.environment);
                        const token = await CmsAccessToken.findOne({
                            query: { token: accessToken }
                        });
                        console.log("4");

                        console.log("Token = ");
                        console.log(token);
                        if (!token) {
                            return reject("Access token is invalid!");
                        }
                        const allowedEnvironments = await token.environments;
                        const currentEnvironment = context.cms.getEnvironment();
                        console.log(allowedEnvironments);
                        console.log(currentEnvironment);
                        if (!allowedEnvironments.find(env => env.id === currentEnvironment.id)) {
                            return reject(
                                `Your Token cannot access environment ${currentEnvironment.name}`
                            );
                        }
                        console.log("");
                        console.log("");
                        console.log("");
                        console.log(context);
                        console.log("");
                        // console.log(JSON.stringify(context, null, 2));
                        console.log("");
                        console.log("");
                        console.log("Hellooo        f");
                        console.log("Hellooo        ");
                        console.log("Hellooo        ");
                        console.log("Hellooo        ");
                        console.log("Hellooo        ");
                        // throw 848128123;
                    }
                } catch (e) {
                    console.log(e);
                    return reject(e);
                }
                return resolve();
            });
        }
    },
    graphql(options),
    modelFields,
    graphqlFields,
    filterOperators()
];
