import { validation } from "@webiny/validation";
import withChangedOnFields from "./withChangedOnFields";
import {
    pipe,
    withFields,
    string,
    ref,
    withName,
    skipOnPopulate,
    withProps
} from "@webiny/commodo";
import crypto from "crypto";

const generateToken = (tokenLength = 48) =>
    crypto
        .randomBytes(Math.ceil(tokenLength / 2))
        .toString("hex")
        .slice(0, tokenLength);

export default ({ createBase, context }) => {
    const { CmsEnvironment } = context.models;

    const getAvailableScopes = async () => {
        const envs = await CmsEnvironment.find({});
        const scopes = [];

        for (let env of envs) {
            const contentModels = env.contentModels;
            for (let apiType of ["read", "preview"]) {
                for (let contentModel of contentModels) {
                    const modelId = contentModel.modelId;
                    const currentScope = `cms:${apiType}:${env.slug}:${modelId}`;

                    scopes.push(currentScope);
                }
            }
        }

        return scopes;
    };

    return pipe(
        withName("CmsAccessToken"),
        withChangedOnFields(),
        withFields(() => ({
            name: string({ validation: validation.create("required,maxLength:100") }),
            description: string({ validation: validation.create("maxLength:100") }),
            token: skipOnPopulate()(
                string({
                    validation: validation.create("maxLength:64"),
                    value: generateToken()
                })
            ),
            environments: ref({
                list: true,
                instanceOf: [context.models.CmsEnvironment, "accessToken"],
                using: [context.models.CmsEnvironment2AccessToken, "environment"]
            }),
            scopes: string({
                list: true,
                validation: async scopes => {
                    /* TODO [Andrei-maybe]: perhaps we should fix the error results so they're more clear on failure:
                    * async functions return "null" data
                    * non-async functions return VALIDATION_FAILED_INVALID_FIELDS:

                    Error: Failed: "{
                          \"code\": \"VALIDATION_FAILED_INVALID_FIELDS\",
                          \"message\": \"Validation failed.\"
                    }"
                    * */
                    if (!scopes) {
                        return;
                    }
                    const availableScopes = await getAvailableScopes();
                    console.log(1);
                    console.log(scopes);
                    console.log(availableScopes);
                    for (let scope of scopes) {
                        console.log("Testing " + scope);
                        if (!availableScopes.includes(scope)) {
                            console.log("Bad scope!");
                            throw new Error(
                                `Scope ${scope} is invalid! Use one of the existing scopes: ${availableScopes}`
                            );
                        }
                    }
                }
            })
        }))
    )(createBase());
};
