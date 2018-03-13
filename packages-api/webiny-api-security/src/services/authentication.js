// @flow
import { Identity } from "./../index";
import AuthenticationError from "./authenticationError";
import type { IAuthentication, IToken } from "./../../types";

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
    createToken(identity: Identity, expiresOn: ?number): Promise<string> {
        return this.config.token.encode(identity, expiresOn);
    }

    /**
     * Verify token and return Identity instance.
     * @param {string} token
     * @return {Promise<null|Identity>} Identity instance.
     */
    async verifyToken(token: string): Promise<Identity> {
        const decoded = await this.config.token.decode(token);
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
     * @param req
     * @param identity
     * @param strategy
     * @returns {Identity} A valid system Identity.
     */
    authenticate(
        req: express$Request,
        identity: Class<Identity>,
        strategy: string
    ): Promise<Identity> {
        const strategyFn = this.config.strategies[strategy];
        if (!strategyFn) {
            return Promise.reject(
                new AuthenticationError(
                    `Strategy "${strategy}" not found!`,
                    AuthenticationError.UNKNOWN_STRATEGY,
                    { strategy }
                )
            );
        }

        return strategyFn(req, identity);
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
}

export default Authentication;
