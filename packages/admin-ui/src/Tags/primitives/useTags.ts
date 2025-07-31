import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import {
    TagsInputPresenter,
    TagsPresenter,
    type TagsPresenterParams,
    TagsValuesPresenter
} from "./presenters";
import type { TagsPrimitiveProps } from "./TagsPrimitive";

export const useTags = (props: TagsPrimitiveProps) => {
    const params: TagsPresenterParams = useMemo(
        () => ({
            values: props.value,
            protectedValues: props.protectedValues,
            placeholder: props.placeholder,
            onValueChange: props.onChange,
            onValueInput: props.onValueInput,
            onValueAdd: props.onValueAdd,
            onValueRemove: props.onValueRemove
        }),
        [
            props.value,
            props.protectedValues,
            props.placeholder,
            props.onChange,
            props.onValueInput,
            props.onValueAdd,
            props.onValueRemove
        ]
    );

    const presenter = useMemo(() => {
        const inputPresenter = new TagsInputPresenter();
        const valuesPresenter = new TagsValuesPresenter();

        return new TagsPresenter(inputPresenter, valuesPresenter);
    }, []);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        presenter.init(params);
    }, [params, presenter]);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    return {
        vm,
        inputValue: presenter.inputValue,
        addValue: presenter.addValue,
        removeValue: presenter.removeValue
    };
};
