import environment from "./environment.crud";
import environmentAlias from "./environmentAlias.crud";
import settings from "./settings.crud";
import contentModelGroup from "../../common/crud/contentModelGroup.crud";

// TODO switch for a real one
const dataManager = {
    type: "context",
    apply(context) {
        context.crud = {
            ...(context.crud || {}),
            dataManager: {
                copyEnvironment: async (): Promise<void> => {
                    return;
                },
                deleteEnvironment: async (): Promise<void> => {
                    return;
                }
            }
        };
    }
};

export default () => [environment, environmentAlias, dataManager, settings, contentModelGroup];
