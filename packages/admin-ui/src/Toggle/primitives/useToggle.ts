import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import type { TogglePrimitiveProps } from "./TogglePrimitive.js";
import type { TogglePresenterParams } from "./presenters/TogglePresenter.js";
import { TogglePresenter } from "./presenters/TogglePresenter.js";

export const useToggle = (props: TogglePrimitiveProps) => {
    const params: TogglePresenterParams = useMemo(
        () => ({
            id: props.id,
            label: props.label,
            value: props.value,
            checked: props.checked,
            disabled: props.disabled,
            icon: props.icon,
            iconPosition: props.iconPosition,
            onChange: props.onChange
        }),
        [
            props.id,
            props.label,
            props.value,
            props.checked,
            props.disabled,
            props.icon,
            props.iconPosition,
            props.onChange
        ]
    );

    const presenter = useMemo(() => {
        const presenter = new TogglePresenter();
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

    return { vm, changeChecked: presenter.changeChecked };
};
