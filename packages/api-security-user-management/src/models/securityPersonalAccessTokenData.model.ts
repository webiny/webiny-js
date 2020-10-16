import KSUID from "ksuid";
import { validation } from "@webiny/validation";
import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withFields, string } from "@commodo/fields";
import { withProps } from "repropose";
import { SK_USER } from "./securityUserData.model";

const PK_PAT = "PAT";

export const SecurityPersonalAccessTokenData = ({ context }) =>
    compose(
        withName(PK_PAT),
        withFields(() => ({
            id: string({ value: KSUID.randomSync().string }),
            __type: string({ value: PK_PAT }),
            name: string({ validation: validation.create("required,maxLength:100") }),
            token: string({ validation: validation.create("required,maxLength:64") }),
            user: string({
                validation: validation.create("required")
            })
        })),
        withProps(instance => ({
            get userData() {
                const Model = context.models.SECURITY;

                return new Promise(async (resolve, reject) => {
                    const user = await Model.findOne({
                        query: {
                            PK: `U#${instance.user}`,
                            SK: SK_USER
                        }
                    });

                    if (!user) {
                        reject(`No user associated with "${instance.name}" Personal Access Token!`);
                    }

                    resolve(user.data);
                });
            }
        }))
    )();
