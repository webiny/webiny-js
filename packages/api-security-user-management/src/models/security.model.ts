import { compose } from "ramda";
import { withName } from "@commodo/name";
import { withPrimaryKey, withKey } from "@commodo/fields-storage";
import { withStorage } from "@commodo/fields-storage";
import { withHooks, hasHooks } from "@commodo/hooks";
import { validation } from "@webiny/validation";
import { withProps } from "repropose";
import {
    withFields,
    string,
    boolean,
    fields,
    onSet,
    skipOnPopulate,
    setOnce
} from "@commodo/fields";
import { object } from "commodo-fields-object";
import md5 from "md5";
import KSUID from "ksuid";

const PK_USER = "U";
const SK_USER = "A";
const GSI1_PK_USER = "USER";

export const SecurityUserData = ({ context }) =>
    compose(
        withName(PK_USER),
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
                        throw Error("User with given e-mail already exists.");
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
            // TODO: Let's see
            avatar: string(),
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
                const Model = context.models.SecurityDDBModel;

                return new Promise(async resolve => {
                    // Get group item from table
                    const groupRecord = await Model.findOne({
                        query: {
                            PK: `${PK_GROUP}#${this.group}`,
                            SK: SK_GROUP
                        }
                    });

                    resolve(groupRecord.data);
                });
            },
            get permissions() {
                if (this.__permissions) {
                    return this.__permissions;
                }

                return new Promise(async resolve => {
                    const data = await this.groupData;

                    this.__permissions = data.permissions;

                    resolve(this.__permissions);
                });
            },
            get personalAccessTokensData() {
                const Model = context.models.SecurityDDBModel;

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

const PK_GROUP = "G";
const SK_GROUP = "A";

export const SecurityGroupData = ({ context }) =>
    compose(
        withName(PK_GROUP),
        withFields(() => ({
            __type: string({ value: PK_GROUP }),
            id: string({ value: KSUID.randomSync().string }),
            createdOn: compose(
                skipOnPopulate(),
                setOnce()
            )(string({ value: new Date().toISOString() })),
            savedOn: compose(skipOnPopulate())(string({ value: new Date().toISOString() })),
            name: string({ validation: validation.create("required") }),
            slug: string({ validation: validation.create("required") }),
            description: string({ validation: validation.create("required") }),
            system: boolean(),
            permissions: object({
                list: true,
                value: []
            })
        })),
        withHooks({
            async beforeCreate(parent) {
                const existingGroup = await parent.constructor.findOne({
                    query: { GSI1_PK: "Group", GSI1_SK: `slug#${this.slug}` }
                });
                if (existingGroup) {
                    throw Error(`Group with slug "${this.slug}" already exists.`);
                }
            },
            async beforeDelete() {
                if (this.system) {
                    throw Error(`Cannot delete system group.`);
                }
            }
        })
    )();

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
                const Model = context.models.SecurityDDBModel;

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

const DATA_HOOKS = ["beforeCreate", "beforeDelete", "afterSave"];

export default ({ context }) =>
    compose(
        withName("SECURITY"),
        withPrimaryKey("PK", "SK"),
        withKey({
            name: "GSI1",
            fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }],
            unique: true
        }),
        withFields({
            PK: compose(setOnce(), skipOnPopulate())(string()),
            SK: compose(setOnce(), skipOnPopulate())(string()),
            GSI1_PK: string(),
            GSI1_SK: string(),
            GSI_DATA: fields({
                validation: validation.create("required"),
                instanceOf: [
                    context.models.SecurityUser,
                    context.models.SecurityGroup,
                    context.models.SecurityPersonalAccessToken,
                    "__type"
                ]
            }),
            data: fields({
                validation: validation.create("required"),
                instanceOf: [
                    context.models.SecurityUser,
                    context.models.SecurityGroup,
                    context.models.SecurityPersonalAccessToken,
                    "__type"
                ]
            })
        }),
        // Enables registering storage hooks ("beforeCreate", "beforeDelete", ...) on "data" field's model instance.
        // We pass the model instance as parent to all registered hook callbacks. This allows us to, for example,
        // fetch the constructor and perform additional database queries, if needed.
        withHooks(instance =>
            DATA_HOOKS.reduce((hooks, name) => {
                hooks[name] = () => hasHooks(instance.data) && instance.data.hook(name, instance);
                return hooks;
            }, {})
        ),
        withStorage({
            maxLimit: 10000,
            driver: context.commodo.driver
        })
    )();
