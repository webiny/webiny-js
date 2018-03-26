import { Webiny } from "webiny-client";
import Skeleton from "webiny-skeleton-app";
import Acl from "./Modules/Acl";
import Layout from "./Modules/Layout";
import Logger from "./Modules/Logger";
import Dashboard from "./Modules/Dashboard";
import I18N from "./Modules/I18N";
import "./Components";

class BackendApp extends Webiny.App {
    constructor(config = { path: "/admin" }) {
        super();
        this.name = "Webiny.Backend";
        this.dependencies = [new Skeleton.App()];

        this.modules = [
            new Acl(this),
            new I18N(this),
            new Layout(this),
            new Logger(this),
            new Dashboard(this)
        ];

        Webiny.Router.setBaseUrl(config.path);
        Webiny.Router.setTitlePattern("%s | Webiny");
    }
}

export default BackendApp;
//# sourceMappingURL=App.js.map
