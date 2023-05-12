import { ContextPlugin } from "@webiny/api";
import { PbContext } from "~/graphql/types";

export type Markable = "render" | "flush";

export const createPrerenderingHandlers = (tracker: PrerenderingTracking) => {
    return new ContextPlugin<PbContext>(context => {
        context.pageBuilder.setPrerenderingHandlers({
            render: async () => {
                tracker.add("render");
            },
            flush: async () => {
                tracker.add("flush");
            }
        });
    });
};

export class PrerenderingTracking {
    private readonly mark = new Map<Markable, number>();

    public reset(): void {
        this.mark.clear();
    }

    public getCount(name: Markable): number {
        return this.mark.get(name) || 0;
    }

    public add(name: Markable): void {
        const count = this.getCount(name);
        this.mark.set(name, count + 1);
    }
}
