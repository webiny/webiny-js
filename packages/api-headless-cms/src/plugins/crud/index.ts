import environment from "./environment.crud";
import environmentAlias from "./environmentAlias.crud";

const dataManager = {
    type: "context",
    apply(context) {
        context.cms = {
            ...(context.cms || {}),
            dataManager: {
                copyEnvironment: async (): Promise<void> => {
                    return;
                }
            }
        };
    }
};

export default () => [environment, environmentAlias, dataManager];
