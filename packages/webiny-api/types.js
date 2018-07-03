// @flow
import type { Attribute } from "webiny-model";
import type _Schema from "./graphql/Schema";
import type { Entity as _Entity, Identity } from "./entities";

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

export interface IStrategy {
    /**
     * Define args for GraphQL endpoint
     */
    args: () => Object;
    authenticate: (args: Object, identity: Class<Identity>) => Promise<Identity>;
}

export type AppType = {
    preInit?: Function,
    init?: Function,
    postInit?: Function,
    install?: Function,
    preInstall?: Function,
    postInstall?: Function,
    configure?: Function
};

export type LambdaEvent = {
    security: {
        permissions: Object,
        identity: ?Identity,
        sudo: boolean
    },
    entityPool: Object
};
