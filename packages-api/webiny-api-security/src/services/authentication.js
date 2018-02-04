// @flow
import { Identity } from "./../index";
import AuthenticationError from "./authenticationError";

import type { IAuthentication, IToken } from "./../../flow-typed";
import type { express$Request } from "webiny-api/flow-typed/npm/express_v4.x.x";

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
    async createToken(identity: Identity, expiresOn: number): Promise<string> {
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
            throw new AuthenticationError("Unknown identity", AuthenticationError.UNKNOWN_IDENTITY);
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
                    AuthenticationError.UNKNOWN_STRATEGY
                )
            );
        }

        return strategyFn(req, identity);
    }

    /**
     * Get identity class.
     * @param {string} classId
     * @returns {Class<Identity>} Identity class corresponding to `classId`.
     */
    getIdentityClass(classId: string): Class<Identity> | null {
        for (let i = 0; i < this.config.identities.length; i++) {
            if (this.config.identities[i].identity.classId === classId) {
                return this.config.identities[i].identity;
            }
        }
        return null;
    }
}

export default Authentication;
