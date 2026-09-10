import { makeAutoObservable, computed } from "mobx";
import {
    AuditLogDetailsPresenter as Abstraction,
    type IAuditLogDetailsVm
} from "./abstractions.js";
import type { IAuditLog } from "~/types.js";

class AuditLogDetailsPresenterImpl implements Abstraction.Interface {
    private _auditLog: IAuditLog | null = null;

    constructor() {
        makeAutoObservable(this, { vm: computed }, { autoBind: true });
    }

    get vm(): IAuditLogDetailsVm {
        return {
            auditLog: this._auditLog,
            content: this.parseContent()
        };
    }

    init(auditLog: IAuditLog): void {
        this._auditLog = auditLog;
    }

    private parseContent(): Record<string, unknown> {
        if (!this._auditLog) {
            return {};
        }
        try {
            return JSON.parse(this._auditLog.content);
        } catch {
            return {};
        }
    }
}

export const AuditLogDetailsPresenter = Abstraction.createImplementation({
    implementation: AuditLogDetailsPresenterImpl,
    dependencies: []
});
