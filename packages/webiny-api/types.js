// @flow
import type { Attribute } from "webiny-model";
import type _Schema from "./lib/graphql/Schema";
import type { Entity as _Entity } from "./lib/index";
import type { EntityCollection } from "webiny-entity";
import type { Identity, Role } from "./src";

export type Schema = _Schema;
export type Entity = _Entity;

export type ImageProcessor = ({
    image: Buffer,
    transformations: Array<{ action: string }>
}) => Buffer;

export type AttributeToTypeParams = {
    attr: Attribute,
    schema: Schema,
    modelToType: Function,
    convertModelToType: Function
};

/**
 * Implement this interface to allow objects to be passed to Authorization service.
 * To make users as flexible as possible we only require 2 methods to be implemented: hasRole() and getRoles().
 */
export interface IAuthorizable {
    /**
     * Checks whether the user has the specified role.
     * @param {string} role
     * @returns {boolean}
     */
    hasRole(role: string): Promise<boolean>;

    /**
     * Returns all user's roles.
     * @returns {Array<Role>} All roles assigned to the user.
     */
    getRoles(): Promise<Array<Role> | EntityCollection<Role>>;
}

/**
 * Interface for Authentication service.
 */
export interface IAuthentication {
    /**
     * Authenticate request.
     * @param {express$Request} req
     * @param {Identity} identity
     * @param {string} strategy
     * @returns {Identity} A valid Identity instance.
     */
    authenticate(
        req: express$Request,
        identity: Class<Identity>,
        strategy: string
    ): Promise<Identity>;

    /**
     * Create an authentication token for the given user.
     * @param {Identity} identity Identity to create the token for.
     * @param {number} expiresOn Seconds since epoch when token should expire.
     * @returns {string}
     */
    createToken(identity: Identity, expiresOn: number): Promise<string>;

    /**
     * Verify token and return a valid Identity instance.
     * @param {string} token
     * @returns {Identity}
     */
    verifyToken(token: string): Promise<Identity>;

    /**
     * Get identity class.
     * @param {string} classId
     * @returns {Class<Identity>} Identity class corresponding to `classId`.
     */
    getIdentityClass(classId: string): Class<Identity> | null;

    /**
     * Get all set identity classes.
     * @returns {Array<Class<Identity>>} All set Identity classes.
     */
    getIdentityClasses(): Array<Class<Identity>> | null;
}

/**
 * Interface for Token implementation.
 */
export interface IToken {
    /**
     * Get data to encode.
     * @param {Identity} identity Identity instance to be encoded.
     * @returns {Promise<Object>}
     */
    data(identity: Identity): Promise<Object>;
    /**
     * Encode Identity instance.
     * @param {Identity} identity Identity instance to encode.
     * @param {number} expiresOn Seconds since epoch.
     * @returns {Promise<string>}
     */
    encode(identity: Identity, expiresOn: number): Promise<string>;
    /**
     * Decode token.
     * @param {string} token
     * @return {Object} Token data.
     */
    decode(token: string): Promise<Object>;
}
