import type { IncomingMessage } from "node:http";
import { createAbstraction } from "@webiny/feature/api";

type UpgradeDecision = { allowed: true } | { allowed: false; statusCode: number; reason: string };

export interface IWebsocketsUpgradeHandler {
    shouldUpgrade(request: IncomingMessage): Promise<UpgradeDecision>;
}

export const WebsocketsUpgradeHandler = createAbstraction<IWebsocketsUpgradeHandler>(
    "WebsocketsUpgradeHandler"
);

export namespace WebsocketsUpgradeHandler {
    export type Interface = IWebsocketsUpgradeHandler;
    export type Decision = UpgradeDecision;
}
