// @flow
import { Identity } from "./../index";
import AuthenticationError from "./authenticationError";
import { Entity, app } from "./..";
import { SecuritySettings } from "./..";
import type { IAuthentication, IToken } from "./../../types";
import _ from "lodash";

class SecurityService implements IAuthentication {
    config: {
        token: IToken,
        strategies: {
            [name: string]: (req: express$Request, identity: Class<Identity>) => Promise<Identity>
        },
        identities: Array<Object>
    };
    superUser: boolean;
    constructor(config: Object) {
        this.config = config;
        this.settings = null;
        this.superUser = false;
    }

    async init() {
        this.settings = (await SecuritySettings.load()).data;
        ["create", "update", "delete", "read"].forEach(operation => {
            Entity.on(operation, async ({ entity }) => {
                const { identity } = app.getRequest();

                const canExecuteOperation = await this.canExecuteOperation(
                    identity,
                    entity,
                    operation
                );
                if (!canExecuteOperation) {
                    throw Error(
                        `Cannot execute "${operation}" operation on entity "${entity.classId}"`
                    );
                }

                if (operation === "create") {
                    if (identity) {
                        entity.owner = identity;
                    }
                }
            });
        });
    }

    /**
     * Returns Identity class for given `classId`.
     * @param {string} classId
     * @returns {Class<Identity>} Identity class corresponding to given `classId`.
     */
    getIdentityClass(classId: string): Class<Identity> | null {
        for (let i = 0; i < this.config.identities.length; i++) {
            if (this.config.identities[i].identity.classId === classId) {
                return this.config.identities[i].identity;
            }
        }
        return null;
    }

    /**
     * Returns set `Identity` classes.
     * @returns {Array<Class<Identity>>} Set `Identity` classes.
     */
    getIdentityClasses(): Array<Class<Identity>> | null {
        return this.config.identities.map(current => {
            return current.identity;
        });
    }

    getIdentity() {
        return app.getRequest().identity;
    }

    setIdentity(identity) {
        app.getRequest().identity = identity;
        return this;
    }

    identityIsOwner(identity, entity) {
        const entityOwner = entity.getAttribute("owner").value.getCurrent();
        return identity.id === _.get(entityOwner, "id", entityOwner);
    }

    identityIsInGroup(identity, entity) {
        const identityGroups = identity.getAttribute("groups").value.getCurrent() || [];
        const entityGroups = entity.getAttribute("groups").value.getCurrent() || [];
        for (let i = 0; i < identityGroups.length; i++) {
            let identityGroup = identityGroups[i];
            for (let j = 0; j < entityGroups.length; j++) {
                let entityGroup = entityGroups[j];
                if (identityGroup.id === _.get(entityGroup, "id", entityGroup)) {
                    return true;
                }
            }
        }

        return false;
    }

    async canExecuteOperation(identity, entity, operation) {
        if (_.get(this.settings, `entities.${entity.classId}.other.operations.${operation}`)) {
            return true;
        }

        if (!identity) {
            return false;
        }

        if (this.identityIsOwner(identity, entity)) {
            if (_.get(this.settings, `entities.${entity.classId}.owner.operations.${operation}`)) {
                return true;
            }
        }

        if (this.identityIsInGroup(identity, entity)) {
            if (_.get(this.settings, `entities.${entity.classId}.group.operations.${operation}`)) {
                return true;
            }
        }

        // Check if one of the groups user belongs to allows action.
        const groups = await identity.groups;
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i];
            if (_.get(group, `permissions.entities.${entity.classId}.operations.${operation}`)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create an authentication token for the given user
     * @param identity
     * @param expiresOn
     */
    createToken(identity: Identity, expiresOn: number): Promise<string> {
        return this.config.token.encode(identity, expiresOn);
    }

    /**
     * Verify token and return Identity instance.
     * @param {string} token
     * @return {Promise<null|Identity>} Identity instance.
     */
    async verifyToken(token: string): Promise<Identity> {
        const decoded = await this.config.token.decode(token.replace("Bearer ", ""));
        let identity = this.getIdentityClass(decoded.data.classId);

        if (!identity) {
            throw new AuthenticationError(
                `Unknown identity '${decoded.data.classId}'`,
                AuthenticationError.UNKNOWN_IDENTITY,
                { classId: decoded.data.classId }
            );
        }

        const identityId = decoded.data.identityId;
        const instance = await identity.findById(identityId);
        if (!instance) {
            throw new AuthenticationError(
                `Identity ID ${identityId} not found!`,
                AuthenticationError.IDENTITY_INSTANCE_NOT_FOUND
            );
        }

        return instance;
    }

    /**
     * Authenticate request.
     * @param data
     * @param identity
     * @param strategy
     * @returns {Identity} A valid system Identity.
     */
    async authenticate(
        data: Object,
        identity: Class<Identity>,
        strategy: string
    ): Promise<Identity> {
        const strategyObject = this.config.strategies[strategy];
        if (!strategyObject) {
            return Promise.reject(
                new AuthenticationError(
                    `Strategy "${strategy}" not found!`,
                    AuthenticationError.UNKNOWN_STRATEGY,
                    { strategy }
                )
            );
        }

        return await strategyObject.authenticate(data, identity);
    }
}

export default SecurityService;
