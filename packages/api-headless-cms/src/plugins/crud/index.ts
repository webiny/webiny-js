import dataManager from "./dataManager.crud";
import environment from "./environment.crud";
import environmentAlias from "./environmentAlias.crud";

export default () => [environment, environmentAlias, dataManager];
