import { makeAutoObservable } from "mobx";

import {
    QueryObject,
    QueryObjectDTO,
    QueryObjectMapper,
    QueryObjectRepository
} from "../QueryObject";

interface IQuerySaverPresenter {
    load: () => Promise<void>;
    persistQueryObject: (queryObject: QueryObjectDTO, mode: string) => Promise<void>;
    setQueryObject: (queryObject: QueryObjectDTO) => void;
    vm: QuerySaverViewModel;
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

    constructor(repository: QueryObjectRepository) {
        this.repository = repository;
        this.queryObject = QueryObjectMapper.toDTO(
            QueryObject.createEmpty(this.repository.modelId)
        );
        makeAutoObservable(this);
    }

    get vm() {
        return {
            queryObject: this.queryObject,
            invalidFields: this.invalidFields
        };
    }

    async load() {
        //
    }

    updateQueryObject(queryObject: QueryObjectDTO | null) {
        if (queryObject) {
            this.queryObject = queryObject;
        } else {
            this.queryObject = QueryObjectMapper.toDTO(
                QueryObject.createEmpty(this.repository.modelId)
            );
        }
    }

    setQueryObject(queryObject: QueryObjectDTO) {
        this.queryObject = queryObject;

        if (this.formWasSubmitted) {
            this.validateQueryObject(queryObject);
        }
    }

    persistQueryObject = async (queryObject: QueryObjectDTO, mode: string) => {
        if (mode === "UPDATE") {
            await this.repository.updateFilter(queryObject);
        } else {
            await this.repository.createFilter(queryObject);
        }
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

        return validation;
    }
}
