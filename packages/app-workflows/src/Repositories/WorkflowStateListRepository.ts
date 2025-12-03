import type {
    IWorkflowStateListRepository,
    IWorkflowStateListRepositoryListParams,
    WorkflowStateListRepositoryType
} from "~/Repositories/abstractions/WorkflowStateListRepository.js";
import { type IGenericError, type IGenericMeta, type IWorkflowState } from "~/types.js";
import { makeAutoObservable, observable, runInAction } from "mobx";
import type { IWorkflowStateListGateway } from "~/Gateways/index.js";

interface IWorkflowStateListRepositoryParams {
    gateway: IWorkflowStateListGateway;
    type: WorkflowStateListRepositoryType;
}

export class WorkflowStateListRepository implements IWorkflowStateListRepository {
    readonly #gateway;
    private _type;

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

    public get type() {
        return this._type;
    }

    public constructor(params: IWorkflowStateListRepositoryParams) {
        this.#gateway = params.gateway;
        this._type = params.type;

        this.items = observable.array<IWorkflowState>([]);
        this._meta = observable.object<IGenericMeta>({
            cursor: null,
            hasMoreItems: false,
            totalCount: 0
        });

        makeAutoObservable(this);
    }

    public setType(type: WorkflowStateListRepositoryType) {
        runInAction(() => {
            this._type = type;
        });
    }

    public async list(params: IWorkflowStateListRepositoryListParams): Promise<void> {
        const paramsSnapshot = this.createSnapshot(params);
        runInAction(() => {
            this._error = null;
            this._loading = true;
        });

        const response = await this.listByType(params);

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

    private listByType(params: IWorkflowStateListRepositoryListParams) {
        if (this._type === "own") {
            return this.#gateway.listOwn(params);
        } else if (this._type === "requested") {
            return this.#gateway.listRequested(params);
        }
        return this.#gateway.list(params);
    }

    private createSnapshot(input: IWorkflowStateListRepositoryListParams): string {
        const value = structuredClone({
            ...input,
            __repositoryType: this._type
        });
        delete value.after;
        return JSON.stringify(value);
    }
}
