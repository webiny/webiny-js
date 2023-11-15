import { History, Listener, Blocker, To } from "history";
import type { BrowserHistory } from "history";

export class AdminHistory implements BrowserHistory {
    private history: History;
    private tenantId = "root";

    constructor(history: History) {
        this.history = history;

        return new Proxy(this, {
            get($this: AdminHistory, prop: string, receiver: unknown) {
                if (prop === "action") {
                    return history.action;
                }

                if (prop === "location") {
                    return history.location;
                }
                return Reflect.get($this, prop, receiver);
            }
        });
    }

    get location() {
        return this.history.location;
    }

    get action() {
        return this.history.action;
    }

    setTenant(tenantId: string) {
        this.tenantId = tenantId;
    }

    createHref = (to: To): string => {
        return this.history.createHref(this.includeTenantId(to));
    };

    push = (to: To, state?: any): void => {
        this.history.push(this.includeTenantId(to), state);
    };

    replace = (to: To, state?: any): void => {
        this.history.replace(to, state);
    };

    go = (delta: number): void => {
        this.history.go(delta);
    };

    back = (): void => {
        this.history.back();
    };

    forward = (): void => {
        this.history.forward();
    };

    listen = (listener: Listener): (() => void) => {
        return this.history.listen(listener);
    };

    block = (blocker: Blocker): (() => void) => {
        return this.history.block(blocker);
    };

    private includeTenantId(to: To) {
        if (this.tenantId === "root") {
            return to;
        }

        if (typeof to === "string") {
            return to.startsWith("/t_") ? to : `/t_${this.tenantId}${to}`;
        }

        const pathname = to.pathname || "";

        return {
            ...to,
            pathname: pathname.startsWith("/t_") ? pathname : `/t_${this.tenantId}${pathname}`
        };
    }
}
