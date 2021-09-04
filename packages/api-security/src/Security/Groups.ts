import deepEqual from "deep-equal";
import { object } from "commodo-fields-object";
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { Security } from "../Security";
import {
    CrudOptions,
    Group,
    GroupsStorageOperations,
    GroupsStorageOperationsFactory,
    GroupTenantLink
} from "../types";
import NotAuthorizedError from "../NotAuthorizedError";

const CreateDataModel = withFields({
    tenant: string({ validation: validation.create("required") }),
    name: string({ validation: validation.create("required,minLength:3") }),
    slug: string({ validation: validation.create("required,minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    permissions: object({
        list: true,
        validation: validation.create("required")
    })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:3") }),
    description: string({ validation: validation.create("maxLength:500") }),
    permissions: object({ list: true })
})();

export class Groups {
    protected storage: GroupsStorageOperations;
    protected security: Security;

    constructor(security: Security) {
        this.security = security;
    }

    setStorageOperations(storageFactory: GroupsStorageOperationsFactory) {
        this.storage = storageFactory({
            tenant: this.security.getTenant(),
            plugins: this.security.getPlugins()
        });
    }

    async getGroup(slug: string, options: CrudOptions): Promise<Group> {
        await this.checkPermission(options);
        const tenant = this.security.getTenant();

        let group: Group = null;
        try {
            group = await this.storage.get(tenant, { slug });
        } catch (ex) {
            throw new Error(ex.message || "Could not get group.", ex.code || "GET_GROUP_ERROR", {
                slug
            });
        }
        if (!group) {
            throw new NotFoundError(`Unable to find group with slug: ${slug}`);
        }
        return group;
    }

    async listGroups(options: CrudOptions) {
        await this.checkPermission(options);
        const tenant = this.security.getTenant();
        try {
            return await this.storage.list(tenant, {
                sort: ["createdOn_ASC"]
            });
        } catch (ex) {
            throw new Error(
                ex.message || "Could not list API keys.",
                ex.code || "LIST_API_KEY_ERROR"
            );
        }
    }

    async createGroup(input, options: CrudOptions) {
        await this.checkPermission(options);

        const identity = this.security.getIdentity();
        const tenant = this.security.getTenant();

        await new CreateDataModel().populate({ ...input, tenant }).validate();

        const existing = await this.storage.get(tenant, {
            slug: input.slug
        });
        if (existing) {
            throw new Error(`Group with slug "${input.slug}" already exists.`, "GROUP_EXISTS");
        }

        const group: Group = {
            tenant,
            system: false,
            ...input,
            createdOn: new Date().toISOString(),
            createdBy: identity
                ? {
                      id: identity.id,
                      displayName: identity.displayName,
                      type: identity.type
                  }
                : null
        };

        try {
            return await this.storage.create(tenant, {
                group
            });
        } catch (ex) {
            throw new Error(
                ex.message || "Could not create group.",
                ex.code || "CREATE_GROUP_ERROR",
                {
                    group
                }
            );
        }
    }

    async updateGroup(slug: string, input: Record<string, any>) {
        await this.checkPermission();

        const tenant = this.security.getTenant();

        const model = await new UpdateDataModel().populate(input);
        await model.validate();

        const original = await this.storage.get(tenant, {
            slug
        });
        if (!original) {
            throw new NotFoundError(`Group "${slug}" was not found!`);
        }

        const data = await model.toJSON({ onlyDirty: true });

        const permissionsChanged = !deepEqual(data.permissions, original.permissions);

        const group: Group = {
            ...original,
            ...data
        };
        try {
            const result = await this.storage.update(tenant, {
                original,
                group
            });
            if (permissionsChanged) {
                this.updateTenantLinks(result);
            }
            return result;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not update group.",
                ex.code || "UPDATE_GROUP_ERROR",
                {
                    group
                }
            );
        }
    }

    async deleteGroup(slug) {
        await this.checkPermission();

        const tenant = this.security.getTenant();

        const group = await this.storage.get(tenant, {
            slug
        });
        if (!group) {
            throw new NotFoundError(`Group "${slug}" was not found!`);
        }
        try {
            await this.storage.delete(tenant, {
                group
            });
            return true;
        } catch (ex) {
            throw new Error(
                ex.message || "Could not delete group.",
                ex.code || "DELETE_GROUP_ERROR",
                {
                    group
                }
            );
        }
    }

    private async checkPermission(options?: CrudOptions) {
        if (options && options.auth === false) {
            return;
        }
        const permission = await this.security.getPermission("security.group");

        if (!permission) {
            throw new NotAuthorizedError();
        }
    }

    private async updateTenantLinks(group: Group) {
        const tenant = this.security.getTenant();

        const links = await this.security.identity.listTenantLinksByType<GroupTenantLink>({
            tenant,
            type: "group"
        });

        if (!links.length) {
            return;
        }

        await this.security.identity.updateTenantLinks(
            links.map(link => ({
                ...link,
                data: { permissions: group.permissions }
            }))
        );
    }
}
