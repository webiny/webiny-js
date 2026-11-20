import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import type { ColorPickerPrimitiveProps } from "./ColorPickerPrimitive.js";
import type { ColorPickerPresenterParams } from "./presenters/index.js";
import { ColorPickerPresenter } from "./presenters/index.js";

export const useColorPicker = (props: ColorPickerPrimitiveProps) => {
    const params: ColorPickerPresenterParams = useMemo(
        () => ({
            value: props.value,
            presets: props.presets,
            onOpenChange: props.onOpenChange,
            onValueChange: props.onChange,
            onValueCommit: props.onChangeComplete
        }),
        [props.value, props.presets, props.onOpenChange, props.onChange, props.onChangeComplete]
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
        selectPreset: presenter.selectPreset,
        setOpen: presenter.setOpen
    };
};
