import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import type { ToggleGroupPrimitiveProps } from "./ToggleGroupPrimitive.js";
import type { ToggleGroupPresenterParams } from "./presenters/ToggleGroupPresenter.js";
import { ToggleGroupPresenter } from "./presenters/ToggleGroupPresenter.js";

export const useToggleGroup = (props: ToggleGroupPrimitiveProps) => {
    const params: ToggleGroupPresenterParams = useMemo(
        () => ({
            items: props.items,
            onChange: props.onChange as ((value: string | string[]) => void) | undefined
        }),
        [props.items, props.onChange]
    );

    const presenter = useMemo(() => new ToggleGroupPresenter(), []);

    useEffect(() => {
        presenter.init(params);
    }, [params]);

    const [vm, setVm] = useState(presenter.vm);

    useEffect(() => {
        return autorun(() => {
            setVm(presenter.vm);
        });
    }, [presenter]);

    return { vm, changeValue: presenter.changeValue };
};
