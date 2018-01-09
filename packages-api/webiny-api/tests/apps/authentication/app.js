import { App } from 'webiny-api/src';
import UsersEndpoint from './users';

class Authentication extends App {
    constructor() {
        super();

        this.name = 'Authentication';
        this.endpoints = [UsersEndpoint];
    }
}

export default Authentication;