import { makeAutoObservable, runInAction } from "mobx";

import {
    Mode,
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper,
    QueryObjectRepository
} from "../../QueryObject";

interface IQuerySaverPresenter {
    load: (callback: (viewModel: QuerySaverViewModel) => void) => void;
    persistQueryObject: (queryObject: QueryObjectDTO, mode: Mode) => Promise<void>;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
}

export interface QuerySaverViewModel {
    queryObject: QueryObjectDTO;
    invalidFields: Record<string, { isValid: boolean; message: string }>;
}

export class QuerySaverPresenter implements IQuerySaverPresenter {
    private readonly repository: QueryObjectRepository;
    private queryObject: QuerySaverViewModel["queryObject"];
    private invalidFields: QuerySaverViewModel["invalidFields"] = {};
    private formWasSubmitted = false;
    private callback: ((viewModel: QuerySaverViewModel) => void) | undefined = undefined;
    viewModel: QuerySaverViewModel;

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        this.queryObject = QueryObjectMapper.toDTO(
            QueryObject.createEmpty(this.repository.modelId)
        );
        this.viewModel = {
            queryObject: this.queryObject,
            invalidFields: this.invalidFields
        };
        makeAutoObservable(this);
    }

    load(callback: (viewModel: QuerySaverViewModel) => void) {
        this.callback = callback;
        this.updateViewModel();
    }

    updateViewModel() {
        this.viewModel = {
            queryObject: this.queryObject,
            invalidFields: this.invalidFields
        };
        this.callback && this.callback(this.viewModel);
    }

    updateQueryObject(queryObject: QueryObjectDTO | null) {
        if (queryObject) {
            this.queryObject = QueryObjectMapper.toDTO(QueryObject.create(queryObject));
        } else {
            this.queryObject = QueryObjectMapper.toDTO(
                QueryObject.createEmpty(this.repository.modelId)
            );
        }
        this.updateViewModel();
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;
        this.updateViewModel();

        if (this.formWasSubmitted) {
            this.validateQueryObject(queryObject);
        }
    }

    persistQueryObject = async (queryObject: QueryObjectDTO, mode: Mode) => {
        if (mode === Mode.UPDATE) {
            await this.repository.updateFilter(queryObject);
        } else {
            await this.repository.createFilter(queryObject);
        }

        runInAction(() => {
            this.updateViewModel();
        });
    };

    async onSubmit(queryObject: QueryObjectDTO, onSuccess?: () => void, onError?: () => void) {
        this.formWasSubmitted = true;
        const result = this.validateQueryObject(queryObject);
        if (result.success) {
            onSuccess && onSuccess();
        } else {
            onError && onError();
        }
    }

    private validateQueryObject(data: QueryObjectDTO) {
        const validation = QueryObject.validate(data);

        if (!validation.success) {
            this.invalidFields = validation.error.issues.reduce((acc, issue) => {
                return {
                    ...acc,
                    [issue.path.join(".")]: issue.message
                };
            }, {});
        } else {
            this.invalidFields = {};
        }

        this.updateViewModel();
        return validation;
    }
}
