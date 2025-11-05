import type {
    IWorkflowStateListRepository,
    IWorkflowStateListRepositoryListParams
} from "~/Repositories/abstractions/WorkflowStateListRepository.js";
import type { IGenericError, IGenericMeta, IWorkflowState } from "~/types.js";
import { makeAutoObservable, observable, runInAction } from "mobx";
import type { IWorkflowStateListGateway } from "~/Gateways/index.js";

interface IWorkflowStateListRepositoryParams {
    gateway: IWorkflowStateListGateway;
}

export class WorkflowStateListRepository implements IWorkflowStateListRepository {
    #gateway;

    public readonly items;
    private readonly _meta;
    private _loading: boolean = false;
    private _error: IGenericError | null = null;
    private snapshot = "";

    public get meta(): IGenericMeta {
        return this._meta;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public get error(): IGenericError | null {
        return this._error;
    }

    public constructor(params: IWorkflowStateListRepositoryParams) {
        this.#gateway = params.gateway;
        this.items = observable.array<IWorkflowState>([]);
        this._meta = observable.object<IGenericMeta>({
            cursor: null,
            hasMoreItems: false,
            totalCount: 0
        });

        makeAutoObservable(this);
    }

    public async list(params: IWorkflowStateListRepositoryListParams): Promise<void> {
        const paramsSnapshot = this.createSnapshot(params);
        runInAction(() => {
            this._error = null;
            this._loading = true;
        });

        const response = await this.#gateway.list(params);

        runInAction(() => {
            this._error = response.error;
            this._loading = false;
            if (response.error || !response.data) {
                return;
            }
            if (paramsSnapshot !== this.snapshot) {
                this.snapshot = paramsSnapshot;
                this.items.replace(response.data);
                return;
            }
            this.items.push(...response.data);
        });
    }

    private createSnapshot(input: IWorkflowStateListRepositoryListParams): string {
        const value = structuredClone(input);
        delete value.after;
        return JSON.stringify(value);
    }
}
