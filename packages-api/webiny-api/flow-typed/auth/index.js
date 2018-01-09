import { Entity } from 'webiny-api';

declare interface IAuthConfig {
    jwtSecret: string,
    entity: Entity
}

declare interface IAuth {
    constructor(config: IAuthConfig): any,

    getUser(): Entity,

    processLogin(email: string, password: string): Promise<string>,

    hashPassword(password: string): Promise<string>,

    hashPasswordSync(password: string): string
}