import { validation } from "@webiny/validation";
import withChangedOnFields from "./withChangedOnFields";
import { pipe, withFields, string, ref, withName, skipOnPopulate } from "@webiny/commodo";
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
            description: string({ validation: validation.create("required,maxLength:100") }),
            token: skipOnPopulate()(
                string({
                    validation: validation.create("maxLength:64"),
                    value: generateToken()
                })
            ),
            environments: ref({
                list: true,
                instanceOf: [context.models.CmsEnvironment, "accessToken"],
                using: [context.models.CmsEnvironment2CmsAccessToken, "environment"]
            })
        }))
    )(createBase());
