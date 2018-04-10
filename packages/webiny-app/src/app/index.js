// @flow
import axios from "axios";
import compose from "webiny-compose";
import debugFactory from "debug";
import { ServiceManager } from "webiny-service-manager";

import ModuleLoader from "./ModuleLoader";
import { Router } from "webiny-react-router";
import GraphQLCLient from "./../graphql/Client";

const debug = debugFactory("webiny-app");

declare type Configurator = (app: App) => Promise<void>;
declare type ConfigLoader = () => Promise<Object>;

class App {
    config: Object;
    configurators: Array<Configurator>;
    configLoader: ConfigLoader;
    modules: ModuleLoader;
    services: ServiceManager;
    router: Router;
    initialized: boolean;
    graphql: GraphQLCLient;

    constructor() {
        this.configurators = [];
        this.modules = new ModuleLoader();
        this.services = new ServiceManager();
        this.router = new Router();
        this.graphql = new GraphQLCLient();
        this.initialized = false;
        this.configLoader = () => Promise.resolve({});

        axios.defaults.validateStatus = status => {
            return status >= 200 && status < 500;
        };

        axios.defaults.timeout = 6000;
    }

    use(configurator: Configurator) {
        this.configurators.push(configurator);
    }

    configure(configLoader: ConfigLoader) {
        this.configLoader = configLoader;
    }

    async setup() {
        debug("Started setup");
        this.config = await this.configLoader();
        await compose(this.configurators)({ app: this });
        this.initialized = true;
        debug("Finished setup");
    }
}

export default App;
