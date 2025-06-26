import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { ColorPickerPrimitiveProps } from "./ColorPickerPrimitive";
import { ColorPickerPresenter, ColorPickerPresenterParams } from "./presenters";

export const useColorPicker = (props: ColorPickerPrimitiveProps) => {
    const params: ColorPickerPresenterParams = useMemo(
        () => ({
            value: props.value,
            onOpenChange: props.onOpenChange,
            onValueChange: props.onChange,
            onValueCommit: props.onChangeComplete
        }),
        [props.value, props.onOpenChange, props.onChange, props.onChangeComplete]
    );

    const presenter = useMemo(() => {
        const presenter = new ColorPickerPresenter();
        presenter.init(params);
        return presenter;
    }, []);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        presenter.init(params);
    }, [params]);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    return {
        vm,
        setColor: presenter.setColor,
        commitColor: presenter.commitColor,
        setOpen: presenter.setOpen
    };
};
