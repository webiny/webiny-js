import { App } from "webiny-api/src";
import UsersEndpoint from "./users";

class Crud extends App {
    constructor() {
        super();

        this.name = "Crud";
        this.endpoints = [UsersEndpoint];
    }
}

export default Crud;
