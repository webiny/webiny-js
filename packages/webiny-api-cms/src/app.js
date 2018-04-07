// @flow
import { App } from "webiny-api";
import PagesEndpoint from "./endpoints/pages";
import CategoriesEndpoint from "./endpoints/categories";

class CMS extends App {
    constructor() {
        super();

        this.name = "CMS";

        this.endpoints = [
            PagesEndpoint,
            CategoriesEndpoint
        ];
    }
}

export default CMS;
