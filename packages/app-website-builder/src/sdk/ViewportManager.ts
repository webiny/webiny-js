import { Breakpoint } from "~/sdk/types";
import { environment } from "~/sdk/Environment";

export interface ViewportInfo {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    breakpoint: string;
    breakpoints: Breakpoint[];
}

export class ViewportManager {
    private readonly changeTimeout: number;
    private readonly changeStartSubscribers: Set<(info: ViewportInfo) => void>;
    private readonly changeEndSubscribers: Set<(info: ViewportInfo) => void>;
    private isChanging: boolean;
    private changeTimer: number | null;
    private breakpoints: Breakpoint[] = [
        {
            name: "desktop",
            minWidth: 0,
            maxWidth: 4000
        },
        {
            name: "tablet",
            minWidth: 0,
            maxWidth: 991
        },
        {
            name: "mobile",
            minWidth: 0,
            maxWidth: 767
        }
    ];

    constructor(timeout: number = 150) {
        this.changeTimeout = timeout;
        this.changeStartSubscribers = new Set();
        this.changeEndSubscribers = new Set();
        this.isChanging = false;
        this.changeTimer = null;

        this.handleViewportChange = this.handleViewportChange.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);

        if (environment.isClient()) {
            window.addEventListener("scroll", this.handleScroll, { passive: true });
            window.addEventListener("resize", this.handleResize, { passive: true });
        }
    }

    public onViewportChangeStart(callback: (info: ViewportInfo) => void): () => void {
        this.changeStartSubscribers.add(callback);
        return () => this.changeStartSubscribers.delete(callback);
    }

    public onViewportChangeEnd(callback: (info: ViewportInfo) => void): () => void {
        this.changeEndSubscribers.add(callback);
        return () => this.changeEndSubscribers.delete(callback);
    }

    /**
     * Get the current viewport information
     */
    public getViewport(): ViewportInfo {
        return this.getViewportInfo();
    }

    public destroy(): void {
        if (environment.isClient()) {
            window.removeEventListener("scroll", this.handleScroll);
            window.removeEventListener("resize", this.handleResize);
            if (this.changeTimer !== null) {
                clearTimeout(this.changeTimer);
            }
            this.changeStartSubscribers.clear();
            this.changeEndSubscribers.clear();
        }
    }

    private handleScroll(): void {
        this.handleViewportChange();
    }

    private handleResize(): void {
        this.handleViewportChange();
    }

    private handleViewportChange(): void {
        const viewportInfo = this.getViewportInfo();

        if (!this.isChanging) {
            this.isChanging = true;
            this.notifySubscribers(this.changeStartSubscribers, viewportInfo);
        }

        if (this.changeTimer !== null) {
            clearTimeout(this.changeTimer);
        }

        this.changeTimer = window.setTimeout(() => {
            this.isChanging = false;
            this.notifySubscribers(this.changeEndSubscribers, viewportInfo);
        }, this.changeTimeout);
    }

    private getViewportInfo(): ViewportInfo {
        const modes = [...this.breakpoints].reverse();
        const viewport = environment.isClient()
            ? {
                  width: window.innerWidth,
                  height: window.innerHeight,
                  scrollX: window.scrollX,
                  scrollY: window.scrollY
              }
            : {
                  // During SSR or Next.js build, viewport is not available.
                  height: 0,
                  width: 2000,
                  scrollX: 0,
                  scrollY: 0
              };

        const [breakpoint] = modes.filter(mode => mode.maxWidth >= viewport.width);

        return { ...viewport, breakpoint: breakpoint.name, breakpoints: this.breakpoints };
    }

    private notifySubscribers(
        subscribers: Set<(info: ViewportInfo) => void>,
        viewportInfo: ViewportInfo
    ): void {
        subscribers.forEach(callback => {
            if (typeof callback === "function") {
                callback(viewportInfo);
            }
        });
    }
}

export const viewportManager = new ViewportManager();
