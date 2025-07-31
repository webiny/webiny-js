import { makeAutoObservable } from "mobx";
import minimatch from "minimatch";
import { TagItem, type TagItemFormatted, TagItemMapper } from "~/Tags/domain";

interface TagsValuesPresenterParams {
    values?: string[];
    protectedValues?: string[];
}

interface ITagsValuesPresenter {
    vm: {
        values: TagItemFormatted[];
    };
    init: (params: TagsValuesPresenterParams) => void;
    addValue: (value: string) => void;
    removeValue: (value: string) => void;
    hasValue: (value: string) => boolean;
    isValueProtected: (value: string) => boolean;
}

class TagsValuesPresenter implements ITagsValuesPresenter {
    private values: TagItem[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    init(params: TagsValuesPresenterParams) {
        this.values =
            params.values?.map(value =>
                TagItem.create({
                    label: value,
                    protected: params.protectedValues
                        ? params.protectedValues.some(pattern => minimatch(value, pattern))
                        : false
                })
            ) ?? [];
    }

    get vm() {
        return {
            values: this.values.map(value => TagItemMapper.toFormatted(value))
        };
    }

    public addValue = (value: string) => {
        if (!value || this.values.find(tag => tag.label === value)) {
            return;
        }
        const tagItem = TagItem.create({ label: value });
        this.values.push(tagItem);
    };

    public removeValue = (value: string) => {
        this.values = this.values.filter(
            tagItem => tagItem.label !== value || this.isValueProtected(tagItem.label)
        );
    };

    public hasValue = (value: string) => {
        return !!this.values.find(tag => tag.label === value);
    };

    public isValueProtected = (value: string) => {
        return !!this.values.find(tag => tag.label === value && tag.protected);
    };
}

export { TagsValuesPresenter, type ITagsValuesPresenter, type TagsValuesPresenterParams };
