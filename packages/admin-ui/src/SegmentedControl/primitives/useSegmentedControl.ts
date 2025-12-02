import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import type { SegmentedControlPrimitiveProps } from "./SegmentedControlPrimitive.js";
import type { SegmentedControlPresenterParams } from "./presenters/SegmentedControlPresenter.js";
import { SegmentedControlPresenter } from "./presenters/SegmentedControlPresenter.js";

export const useSegmentedControl = (props: SegmentedControlPrimitiveProps) => {
    const params: SegmentedControlPresenterParams = useMemo(
        () => ({
            items: props.items,
            onValueChange: props.onChange
        }),
        [props.items, props.onChange]
    );

    const presenter = useMemo(() => {
        return new SegmentedControlPresenter();
    }, []);

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
