import type { LayoutUsedByModel } from "./errors.js";

interface LayoutUsageData {
    // The number of pages (not in the trash) rendered with the layout.
    pages: number;
    // Whether the layout is the tenant's default layout.
    isDefault: boolean;
    // The CMS models that render their entries in the layout.
    models: LayoutUsedByModel[];
}

/**
 * What renders with a layout: pages, the tenant's default, and CMS models. A layout in use can't be
 * unpublished or deleted.
 */
export class LayoutUsage {
    private readonly usage: LayoutUsageData;

    private constructor(usage: LayoutUsageData) {
        this.usage = usage;
    }

    static from(usage: LayoutUsageData): LayoutUsage {
        return new LayoutUsage(usage);
    }

    isInUse(): boolean {
        return this.usage.pages > 0 || this.usage.isDefault || this.usage.models.length > 0;
    }
}
