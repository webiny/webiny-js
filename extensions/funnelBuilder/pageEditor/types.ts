import React from "react";
import type { FunnelModelDto } from "../models/FunnelModel";

/* Inputs shape for the Fub/Container element. */
export interface FunnelContainerInputs {
    containerData: FunnelModelDto;
    steps: React.ReactNode[];
    activeStep: number;
}
