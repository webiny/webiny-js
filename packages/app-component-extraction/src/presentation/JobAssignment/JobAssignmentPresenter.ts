import { makeAutoObservable, runInAction } from "mobx";
import { JobAssignmentPresenter as PresenterAbstraction } from "./abstractions.js";
import { ComponentExtractionGateway } from "~/features/gateway/abstractions.js";
import type { JobDto } from "~/shared/types.js";

class JobAssignmentPresenterImpl implements PresenterAbstraction.Interface {
    vm: PresenterAbstraction.ViewModel = {
        jobId: null,
        jobName: "",
        ownerId: null,
        users: null,
        picked: null,
        error: null,
        submitting: false
    };

    constructor(private gateway: ComponentExtractionGateway.Interface) {
        makeAutoObservable(this);
    }

    async open(job: { id: string; name: string; ownerId: string | null }): Promise<void> {
        runInAction(() => {
            this.vm = {
                jobId: job.id,
                jobName: job.name,
                ownerId: job.ownerId,
                users: null,
                picked: job.ownerId,
                error: null,
                submitting: false
            };
        });
        try {
            const users = await this.gateway.listAdminUsers();
            runInAction(() => {
                if (this.vm.jobId === job.id) {
                    this.vm.users = users;
                }
            });
        } catch (error) {
            runInAction(() => {
                this.vm.users = [];
                this.vm.error = `Could not read the admin users: ${(error as Error).message}`;
            });
        }
    }

    close(): void {
        runInAction(() => {
            this.vm.jobId = null;
        });
    }

    pick(userId: string): void {
        runInAction(() => {
            this.vm.picked = userId;
        });
    }

    async confirm(): Promise<JobDto | null> {
        const { jobId, picked } = this.vm;
        if (!jobId || !picked) {
            return null;
        }
        runInAction(() => {
            this.vm.submitting = true;
            this.vm.error = null;
        });
        try {
            const job = await this.gateway.assignJob(jobId, picked);
            runInAction(() => {
                this.vm.submitting = false;
                this.vm.jobId = null;
            });
            return job;
        } catch (error) {
            runInAction(() => {
                this.vm.submitting = false;
                this.vm.error = (error as Error).message;
            });
            return null;
        }
    }
}

export const JobAssignmentPresenterImplementation = PresenterAbstraction.createImplementation({
    implementation: JobAssignmentPresenterImpl,
    dependencies: [ComponentExtractionGateway]
});
