import { Entity } from 'webiny-api';

declare interface IAuth {
    getUser(): Entity,

    processLogin(email: string, password: string): Promise<string>,

    hashPassword(password: string): Promise<string>,

    hashPasswordSync(password: string): string
}