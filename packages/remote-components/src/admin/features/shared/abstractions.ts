import { createAbstraction } from "@webiny/feature/admin";
import type { RemoteComponentDto } from "~/shared/types.js";

export interface IRemoteComponentGateway {
    list(): Promise<{ items: RemoteComponentDto[]; meta: { totalCount: number } }>;
    get(id: string): Promise<RemoteComponentDto>;
    create(data: {
        name: string;
        label: string;
        description?: string;
        aiContext?: string;
        source: string;
        css?: string;
        aiPrompt?: string;
    }): Promise<RemoteComponentDto>;
    update(
        id: string,
        data: {
            name?: string;
            label?: string;
            description?: string;
            aiContext?: string;
            source?: string;
            css?: string;
            bundledJs?: string;
            bundledJsSha256?: string;
            bundledCss?: string;
            bundledCssSha256?: string;
            aiPrompt?: string;
            status?: string;
        }
    ): Promise<RemoteComponentDto>;
    remove(id: string): Promise<boolean>;
    generate(
        prompt: string,
        options?: {
            name?: string;
            label?: string;
            description?: string;
            additionalFileIds?: string[];
        }
    ): Promise<{ id: string }>;
    refine(data: {
        currentSource: string;
        currentCss: string;
        feedback: string;
        additionalFileIds?: string[];
    }): Promise<void>;
}

export const RemoteComponentGateway = createAbstraction<IRemoteComponentGateway>(
    "RemoteComponents/Gateway"
);

export namespace RemoteComponentGateway {
    export type Interface = IRemoteComponentGateway;
}
