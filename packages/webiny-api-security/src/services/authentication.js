// @flow
import { Identity } from "./../index";
import AuthenticationError from "./authenticationError";
import { app } from "webiny-api";
import { SecuritySettings } from "./..";
import type { IAuthentication, IToken } from "./../../types";
import _ from "lodash";

class Authentication implements IAuthentication {
    config: {
        token: IToken,
        strategies: {
            [name: string]: (req: express$Request, identity: Class<Identity>) => Promise<Identity>
        },
        identities: Array<Object>
    };

    constructor(config: Object) {
        this.config = config;
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
    authenticate(data: Object, identity: Class<Identity>, strategy: string): Promise<Identity> {
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

        return strategyObject.authenticate(data, identity);
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

    async init() {
        this.settings = await SecuritySettings.load();
    }

    canSetValue() {
        return true;
    }

    canGetValue() {
        return true;
    }

    canExecuteOperation(identity, entity, operation) {
        if (_.get(entity, "meta.owner") === identity.id) {
            if (
                _.get(
                    this.settings.data,
                    `entities.${entity.classId}.owner.operations.${operation}`
                )
            ) {
                return true;
            }
        }

        // Enables us to fetch the value synchronously (already pre-loaded in security middleware).
        const groups = identity.getAttribute("groups").value.getCurrent() || [];
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i];
            if (group.id === _.get(entity, "meta.group")) {
                if (
                    _.get(
                        this.settings.data,
                        `entities.${entity.classId}.group.operations.${operation}`
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    assignGroup(entity, group) {
        if (!(entity.meta instanceof Object)) {
            entity.meta = {};
        }

        entity.meta.group = group.id;
        return this;
    }

    assignOwner(entity, identity) {
        if (!(entity.meta instanceof Object)) {
            entity.meta = {};
        }

        entity.meta.owner = identity.id;
        return this;
    }

    generateEntitiesList() {
        const classes = app.entities.getEntityClasses();
        const output = [];

        classes.forEach(Entity => {
            const entity = new Entity();
            output.push({
                name: entity.getClassName(),
                id: entity.classId,
                attributes: Object.keys(entity.getAttributes()).map(key => {
                    const attribute = entity.getAttribute(key);
                    return {
                        name: attribute.getName(),
                        class: typeof attribute
                    };
                })
            });
        });

        return output;
    }
}

export default Authentication;
