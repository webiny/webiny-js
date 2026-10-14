import { createAbstraction } from "@webiny/feature/admin";
import type { AdminUserOptionDto, JobDto } from "~/shared/types.js";

export interface IJobAssignmentVm {
    /** The job the dialog is open for; null when closed. */
    jobId: string | null;
    jobName: string;
    /** The job's owner when the dialog opened: preselected, and not a change when picked again. */
    ownerId: string | null;
    /** The admin users to pick from; null while they load. */
    users: AdminUserOptionDto[] | null;
    picked: string | null;
    /** Loading the users or assigning failed (permissions, a missing user, the network). */
    error: string | null;
    /** The assign request is on its way. */
    submitting: boolean;
}

export interface IJobAssignmentPresenter {
    vm: IJobAssignmentVm;
    /** Opens the dialog and reads the admin users afresh. */
    open(job: { id: string; name: string; ownerId: string | null }): Promise<void>;
    close(): void;
    pick(userId: string): void;
    /** Assigns the job to the picked user; the updated job, or null when it failed. */
    confirm(): Promise<JobDto | null>;
}

export const JobAssignmentPresenter = createAbstraction<IJobAssignmentPresenter>(
    "ComponentExtraction/JobAssignmentPresenter"
);

export namespace JobAssignmentPresenter {
    export type Interface = IJobAssignmentPresenter;
    export type ViewModel = IJobAssignmentVm;
}
