import { createAbstraction } from "@webiny/feature/admin";
import type { LayoutUsage } from "../shared/abstractions.js";

export interface IGetLayoutUsageUseCase {
    // What renders with a layout revision: pages, the default layout setting, and CMS models naming its slug.
    execute(id: string): Promise<LayoutUsage>;
}

export const GetLayoutUsageUseCase = createAbstraction<IGetLayoutUsageUseCase>(
    "WebsiteBuilder/GetLayoutUsageUseCase"
);

export namespace GetLayoutUsageUseCase {
    export type Interface = IGetLayoutUsageUseCase;
}
