// @flow
import Api from "./api";
const api = new Api();

export { Api };
export { api };

export { default as graphql } from "./graphql/middleware";
export { default as InvalidAttributesError } from "./graphql/utils/crud/InvalidAttributesError";
export {
    Entity,
    File,
    Image,
    Settings,
    Group,
    Groups2Entities,
    Policy,
    Policies2Entities,
    User,
    ApiToken,
    Identity
} from "./entities";
export { default as MySQLTable } from "./mysql";

export { default as JwtToken } from "./security/tokens/jwtToken";
export { default as credentialsStrategy } from "./security/strategies/credentialsStrategy";
