import { ContextPlugin } from "@webiny/api";
import { AuditLogsAcoContext } from "./types";
import { createApp } from "./app";

export * from "./createAppModifier";

const setupContext = async (context: AuditLogsAcoContext): Promise<void> => {
    const app = await context.aco.registerApp(createApp());

    context.auditLogsAco = {
        app
    };
};

export const createAcoAuditLogsContext = () => {
    const plugin = new ContextPlugin<AuditLogsAcoContext>(async context => {
        if (!context.aco) {
            console.log(
                `There is no ACO initialized so we will not initialize the Audit Logs ACO.`
            );
            return;
        }
        await setupContext(context);
    });

    plugin.name = "audit-logs-aco.createContext";

    return plugin;
};
