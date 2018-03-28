import { App } from "webiny-api";
import UsersEndpoint from "./users";

class Crud extends App {
    constructor() {
        super();

        this.name = "Crud";
        this.endpoints = [UsersEndpoint];
    }
}

export default Crud;
