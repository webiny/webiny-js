import KSUID from "ksuid";
import { validation } from "@webiny/validation";
import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withHooks } from "@commodo/hooks";
import { withFields, string, skipOnPopulate, setOnce, onSet } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { withProps } from "repropose";
import md5 from "md5";
import { PK_GROUP, SK_GROUP } from "./securityGroupData.model";

export const PK_USER = "U";
export const SK_USER = "A";
export const GSI1_PK_USER = "USER";

export const SecurityUserData = ({ context }) =>
    compose(
        withName(PK_USER),
        withHooks(),
        withFields(dataInstance => ({
            __type: string({ value: PK_USER }),
            id: string({ value: KSUID.randomSync().string }),
            createdOn: compose(
                skipOnPopulate(),
                setOnce()
            )(string({ value: new Date().toISOString() })),
            savedOn: compose(skipOnPopulate())(string({ value: new Date().toISOString() })),
            email: onSet(value => {
                if (value === dataInstance.email) {
                    return value;
                }

                value = value.toLowerCase().trim();
                const removeCallback = dataInstance.hook("beforeSave", async parentInstance => {
                    removeCallback();

                    const existingUser = await parentInstance.constructor.findOne({
                        query: { GSI1_PK: GSI1_PK_USER, GSI1_SK: `login#${value}` }
                    });
                    if (existingUser) {
                        throw {
                            message: "User with given e-mail already exists.",
                            code: "USER_EXISTS"
                        };
                    }
                });

                return value;
            })(
                string({
                    validation: validation.create("required")
                })
            ),
            firstName: string(),
            lastName: string(),
            group: string(),
            avatar: object(),
            personalAccessTokens: skipOnPopulate()(
                string({
                    list: true,
                    value: []
                })
            )
        })),
        withProps(dataInstance => ({
            __permissions: null,
            get fullName() {
                return `${dataInstance.firstName} ${dataInstance.lastName}`.trim();
            },
            get gravatar() {
                return "https://www.gravatar.com/avatar/" + md5(dataInstance.email);
            },
            get groupData() {
                const Model = context.models.SECURITY;

                return new Promise(async resolve => {
                    // Get group item from table
                    const groupRecord = await Model.findOne({
                        query: {
                            PK: `${PK_GROUP}#${this.group}`,
                            SK: SK_GROUP
                        }
                    });

                    resolve(groupRecord?.data);
                });
            },
            get permissions() {
                if (this.__permissions) {
                    return this.__permissions;
                }

                return new Promise(async resolve => {
                    const data = await this.groupData;

                    this.__permissions = data?.permissions;

                    resolve(this.__permissions);
                });
            },
            get personalAccessTokensData() {
                const Model = context.models.SECURITY;

                return new Promise(async resolve => {
                    const personalAccessTokens = await Model.find({
                        query: {
                            GSI1_PK: "PAT",
                            GSI1_SK: {
                                $beginsWith: `U#${dataInstance.id}`
                            }
                        }
                    });
                    const personalAccessTokensData = personalAccessTokens.map(pat => pat.GSI_DATA);
                    resolve(personalAccessTokensData);
                });
            }
        }))
    )();
