// @flow
import { Identity } from "./../index";
import AuthenticationError from "./authenticationError";
import { app } from "webiny-api";
import { SecuritySettings } from "./..";
import type { IAuthentication, IToken } from "./../../types";
import _ from "lodash";

class Security implements IAuthentication {
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
        this.settings = await this.sudo(() => {
            return SecuritySettings.load().then(settings => settings.data);
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

    async sudo(option) {
        if (typeof option === "function") {
            this.setSuperUser(true);
            const results = await option();
            this.setSuperUser(false);
            return results;
        }

        this.setSuperUser(option !== false);
    }

    sudoSync(option) {
        if (typeof option === "function") {
            this.setSuperUser(true);
            const results = option();
            this.setSuperUser(false);
            return results;
        }

        this.setSuperUser(option !== false);
    }

    setSuperUser(flag: boolean): Security {
        _.set(app.getRequest(), "security.superUser", flag);
        return this;
    }

    getSuperUser() {
        return _.get(app.getRequest(), "security.superUser");
    }

    identityIsOwner(identity, entity) {
        return this.sudoSync(() => {
            return identity.id === _.get(entity, "meta.owner");
        });
    }

    identityIsInGroup(identity, entity) {
        return this.sudoSync(() => {
            const groups = identity.getAttribute("groups").value.getCurrent() || [];
            for (let i = 0; i < groups.length; i++) {
                let group = groups[i];
                if (group.id === _.get(entity, "meta.group")) {
                    return true;
                }
            }

            return false;
        });
    }

    canSetValue(identity, attribute) {
        if (this.getSuperUser()) {
            return true;
        }

        const entity = attribute.getParentModel().getParentEntity();

        if (
            _.get(
                this.settings,
                `entities.${entity.classId}.other.attributes.${attribute.name}.write`
            )
        ) {
            return true;
        }

        if (!identity) {
            if (this.identityIsOwner(identity, entity)) {
                if (
                    _.get(
                        this.settings,
                        `entities.${entity.classId}.owner.attributes.${attribute.name}.write`
                    )
                ) {
                    return true;
                }
            }

            if (this.identityIsInGroup(identity, entity)) {
                if (
                    _.get(
                        this.settings,
                        `entities.${entity.classId}.group.attributes.${attribute.name}.write`
                    )
                ) {
                    return true;
                }
            }
        }

        // Check if one of the groups user belongs to allows action.
        for (let i = 0; i < identity.getAttribute("groups").value.current.length; i++) {
            let permissions = this.sudoSync(() => {
                return identity.getAttribute("groups").value.current[i].permissions;
            });

            if (
                _.get(permissions, `entities.${entity.classId}.attributes.${attribute.name}.write`)
            ) {
                return true;
            }
        }

        return false;
    }

    canGetValue(identity, attribute) {
        if (this.getSuperUser()) {
            return true;
        }

        const entity = attribute.getParentModel().getParentEntity();

        if (
            _.get(
                this.settings,
                `entities.${entity.classId}.other.attributes.${attribute.name}.read`
            )
        ) {
            return true;
        }

        if (!identity) {
            return false;
        }

        if (this.identityIsOwner(identity, entity)) {
            if (
                _.get(
                    this.settings,
                    `entities.${entity.classId}.owner.attributes.${attribute.name}.read`
                )
            ) {
                return true;
            }
        }

        if (this.identityIsInGroup(identity, entity)) {
            if (
                _.get(
                    this.settings,
                    `entities.${entity.classId}.group.attributes.${attribute.name}.read`
                )
            ) {
                return true;
            }
        }

        // Check if one of the groups user belongs to allows action.
        for (let i = 0; i < identity.getAttribute("groups").value.current.length; i++) {
            let permissions = this.sudoSync(() => {
                return identity.getAttribute("groups").value.current[i].permissions;
            });

            if (
                _.get(permissions, `entities.${entity.classId}.attributes.${attribute.name}.read`)
            ) {
                return true;
            }
        }

        return false;
    }

    canExecuteOperation(identity, entity, operation) {
        if (this.getSuperUser()) {
            return true;
        }

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
        for (let i = 0; i < identity.getAttribute("groups").value.current.length; i++) {
            let group = identity.getAttribute("groups").value.current[i];
            if (_.get(group, `permissions.entities.${entity.classId}.operations.${operation}`)) {
                return true;
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
        const instance = await this.sudo(() => identity.findById(identityId));
        if (!instance) {
            throw new AuthenticationError(
                `Identity ID ${identityId} not found!`,
                AuthenticationError.IDENTITY_INSTANCE_NOT_FOUND
            );
        }

        await this.sudo(() => instance.getAttribute("groups").value.load());

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

        return this.sudo(async () => {
            const authenticated = await strategyObject.authenticate(data, identity);

            // Make sure groups are loaded, so they can synchronously be checked.
            await authenticated.getAttribute("groups").value.load();

            return authenticated;
        });
    }
}

export default Security;
