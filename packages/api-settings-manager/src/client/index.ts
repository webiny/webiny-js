import { ContextPlugin } from "@webiny/graphql/types";
import { SettingsManagerClient } from "./SettingsManagerClient";

interface Params {
    functionName: string;
}

export default ({ functionName }: Params): ContextPlugin => {
    return {
        type: "context",
        name: "context-settings-manager",
        apply(context) {
            context.settingsManager = new SettingsManagerClient({
                functionName
            });
        }
    };
};
