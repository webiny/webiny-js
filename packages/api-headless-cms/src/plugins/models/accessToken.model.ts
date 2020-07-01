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

export default ({ createBase, context }) =>
    pipe(
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
            })
        })),
        withProps({
            get scopes() {
                const { CmsEnvironment } = context.models;
                const envId =
                    (context.cms.getEnvironment && context.cms.getEnvironment()) ||
                    process.env.TEST_ENV_ID;

                return CmsEnvironment.findOne({ id: envId }).then(env => {
                    const contentModels = env.contentModels;
                    const scopes = [];

                    for (let apiType of ["read", "preview"]) {
                        for (let contentModel of contentModels) {
                            const modelId = contentModel.modelId;
                            const currentScope = `cms:${apiType}:${envId}:${modelId}`;

                            scopes.push(currentScope);
                        }
                    }

                    return scopes;
                });
            }
        })
    )(createBase());
