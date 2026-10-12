import { makeAutoObservable, runInAction } from "mobx";
import { JobDeletionPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import type { JobDeletionDto } from "~/shared/types.js";

/** How often the dialog reads the task's progress while a count or a delete runs. */
const POLL_MS = 2000;

const busy = (deletion: JobDeletionDto | null): boolean =>
    deletion?.plan.status === "running" || deletion?.deletion?.status === "running";

class JobDeletionPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        jobId: null,
        jobName: "",
        deletion: null,
        includeSite: false,
        error: null,
        submitting: false
    };

    private timer: ReturnType<typeof setTimeout> | null = null;

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable<this, "timer">(this, { timer: false });
    }

    async open(jobId: string, jobName: string): Promise<void> {
        this.stopPolling();
        runInAction(() => {
            this.vm = {
                jobId,
                jobName,
                deletion: null,
                includeSite: false,
                error: null,
                submitting: false
            };
        });
        await this.recount();
    }

    close(): void {
        this.stopPolling();
        runInAction(() => {
            this.vm.jobId = null;
        });
    }

    setIncludeSite(includeSite: boolean): void {
        runInAction(() => {
            this.vm.includeSite = includeSite;
        });
    }

    async recount(): Promise<void> {
        const jobId = this.vm.jobId;
        if (!jobId) {
            return;
        }
        runInAction(() => {
            this.vm.error = null;
        });
        try {
            const deletion = await this.gateway.planJobDeletion(jobId);
            this.receive(jobId, deletion);
        } catch (error) {
            runInAction(() => {
                this.vm.error = (error as Error).message;
            });
        }
    }

    async confirm(): Promise<void> {
        const jobId = this.vm.jobId;
        const computedOn = this.vm.deletion?.plan.computedOn;
        if (!jobId || !computedOn) {
            return;
        }
        runInAction(() => {
            this.vm.submitting = true;
            this.vm.error = null;
        });
        try {
            const deletion = await this.gateway.deleteJob(jobId, this.vm.includeSite, computedOn);
            runInAction(() => {
                this.vm.submitting = false;
            });
            this.receive(jobId, deletion);
        } catch (error) {
            runInAction(() => {
                this.vm.submitting = false;
                this.vm.error = (error as Error).message;
            });
        }
    }

    /** Take a record, and keep reading while its count or delete runs. */
    private receive(jobId: string, deletion: JobDeletionDto | null): void {
        if (this.vm.jobId !== jobId) {
            return;
        }
        runInAction(() => {
            this.vm.deletion = deletion;
        });
        this.stopPolling();
        if (busy(deletion)) {
            this.timer = setTimeout(async () => {
                try {
                    this.receive(jobId, await this.gateway.getJobDeletion(jobId));
                } catch (error) {
                    runInAction(() => {
                        this.vm.error = (error as Error).message;
                    });
                }
            }, POLL_MS);
        }
    }

    private stopPolling(): void {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

export const JobDeletionPresenterImplementation = PresenterAbstraction.createImplementation({
    implementation: JobDeletionPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
