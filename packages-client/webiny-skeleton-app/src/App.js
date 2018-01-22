import { Webiny } from "webiny-client";

import Ui from "webiny-ui";
import "./Assets/styles.scss";
import "./Assets/images/public/bg-login.png";
import "./Assets/images/public/preloader_2.png";
import "./Assets/images/public/favicon.ico";
import "./Assets/images/public/logo_orange.png";
import UserAccount from "./Modules/UserAccount";
import Layout from "./Modules/Layout";
import Auth from "./Auth";
import registerComponents from "./Components";

export default class Skeleton extends Webiny.App {
    constructor() {
        super();
        this.name = "Webiny.Skeleton";
        this.dependencies = [new Ui.App()];

        registerComponents();
        this.modules = [new Layout(this), new UserAccount(this)];

        Webiny.Router.setDefaultRoute("Dashboard");
        Webiny.Auth = new Auth();
    }
}
