import type { FunnelModelDto } from "../models/FunnelModel";

/* Inputs shape for the Fub/Container element. */
export interface FunnelContainerInputs {
    containerData: FunnelModelDto;
    steps: Array<{
        elementId: string;
        label: string;
        children: string[];
        stepData: { id: string };
    }>;
}
