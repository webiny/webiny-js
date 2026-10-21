/**
 * An error returned by the layouts API, with its code and data, so the UI can recognise it.
 */
export class LayoutError extends Error {
    public readonly code: string;
    public readonly data: Record<string, any> | null;

    constructor(params: { message: string; code?: string; data?: Record<string, any> | null }) {
        super(params.message);
        this.name = "LayoutError";
        this.code = params.code ?? "";
        this.data = params.data ?? null;
    }
}

export const LAYOUT_IN_USE_ERROR = "WebsiteBuilder/Layout/InUse";

export const LAYOUT_NOT_FOUND_ERROR = "WebsiteBuilder/Layout/NotFound";

export const isLayoutNotFoundError = (error: unknown) => {
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: unknown }).code === LAYOUT_NOT_FOUND_ERROR
    );
};

export interface LayoutInUseData {
    id: string;
    // How many pages use the layout.
    pages: number;
    // Whether it's the default layout of new pages.
    isDefault: boolean;
}

export type LayoutInUseError = LayoutError & { data: LayoutInUseData };

export const isLayoutInUseError = (error: unknown): error is LayoutInUseError => {
    return (
        typeof error === "object" &&
        error !== null &&
        (error as { code?: unknown }).code === LAYOUT_IN_USE_ERROR
    );
};

const pagesLabel = (count: number) => (count === 1 ? "1 page" : `${count} pages`);

/**
 * Why a layout can't be unpublished or deleted while it's in use, e.g. "This layout is in use by 3 pages."
 */
export const getLayoutInUseMessage = (data: Partial<LayoutInUseData> | null | undefined) => {
    const pages = Number(data?.pages ?? 0);
    const isDefault = Boolean(data?.isDefault);

    if (pages > 0 && isDefault) {
        return `This layout is the default layout, and is in use by ${pagesLabel(pages)}.`;
    }
    if (isDefault) {
        return "This layout is the default layout. Pick another default layout first.";
    }
    if (pages > 0) {
        return `This layout is in use by ${pagesLabel(pages)}. Pick another layout in their settings first.`;
    }
    return "This layout is in use.";
};

/**
 * The message to show for a failed layout operation: an in-use error gets a clear explanation.
 */
export const getLayoutErrorMessage = (error: unknown) => {
    if (isLayoutInUseError(error)) {
        return getLayoutInUseMessage(error.data);
    }
    if (error instanceof Error) {
        return error.message;
    }
    return String(error ?? "Unknown error.");
};
