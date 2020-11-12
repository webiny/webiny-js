import { withFields, string } from "@commodo/fields";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { validation } from "@webiny/validation";
import { HandlerSecurityContext } from "@webiny/api-security/types";
import { HandlerTenancyContext, User, UsersCRUD } from "../types";
import dbArgs from "./dbArgs";

const CreateDataModel = withFields({
    login: string({ validation: validation.create("required,minLength:2") }),
    firstName: string({ validation: validation.create("required,minLength:2") }),
    lastName: string({ validation: validation.create("required,minLength:2") })
})();

const UpdateDataModel = withFields({
    login: string({ validation: validation.create("minLength:2") }),
    firstName: string({ validation: validation.create("minLength:2") }),
    lastName: string({ validation: validation.create("minLength:2") })
})();

type DbUser = User & {
    PK: string;
    SK: string;
};

export default (
    context: HandlerContextDb & HandlerSecurityContext & HandlerTenancyContext
): UsersCRUD => {
    const { db } = context;
    return {
        async get(login: string) {
            const [[user]] = await db.read<User>({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                limit: 1
            });

            return user;
        },
        async list({ tenant }) {
            const tenantId = tenant ?? context.security.getTenant().id;

            const [users] = await db.read<DbUser>({
                ...dbArgs,
                query: { PK: `T#${tenantId}`, SK: { $beginsWith: "U#" } }
            });

            const batch = db.batch();
            for (let i = 0; i < users.length; i++) {
                batch.read({
                    ...dbArgs,
                    query: {
                        PK: users[i].SK,
                        SK: "A"
                    }
                });
            }

            const results = await batch.execute();

            return results.map(res => res[0][0]);
        },
        async create(data) {
            const identity = context.security.getIdentity();

            if (await this.get(data.login)) {
                throw {
                    message: "User with that login already exists.",
                    code: "USER_EXISTS"
                };
            }

            await new CreateDataModel().populate(data).validate();

            const user: User = {
                ...data,
                createdOn: new Date().toISOString(),
                createdBy: identity
                    ? {
                          id: identity.id,
                          displayName: identity.displayName,
                          type: identity.type
                      }
                    : null
            };

            await db.create({
                data: {
                    PK: `U#${user.login}`,
                    SK: "A",
                    ...user
                }
            });

            return user;
        },
        async update(login, data) {
            const model = await new UpdateDataModel().populate(data);
            await model.validate();
            
            await db.update({
                ...dbArgs,
                query: { PK: `U#${login}`, SK: "A" },
                data: await model.toJSON({ onlyDirty: true })
            });

            return true;
        },
        async delete(login) {
            await db.delete({
                ...dbArgs,
                query: {
                    PK: `U#${login}`,
                    SK: "A"
                }
            });

            return true;
        }
    };
};
