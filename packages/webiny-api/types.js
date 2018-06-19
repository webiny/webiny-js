// @flow
import type { Attribute } from "webiny-model";
import type _Schema from "./lib/graphql/Schema";
import type { Entity as _Entity } from "./lib/index";
import type { Identity } from "./src";
import type { $Request } from "express";

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
    verifyToken(token: string): Promise<?Identity>;

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

export type AppType = {
    preInit?: Function,
    init: Function,
    postInit?: Function,
    install?: Function,
    preInstall?: Function,
    postInstall?: Function,
    configure?: Function
};

export type ApiRequest = $Request & {
    security: {
        permissions: Object,
        identity: ?Identity,
        sudo: boolean
    },
    entityPool: Object
};
