import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { FilePickerPresenter, type FilePickerPresenterParams } from "./presenters/index.js";
import type { FilePickerPrimitiveProps } from "~/FilePicker/index.js";

type IFilePickerPrimitiveProps = Pick<FilePickerPrimitiveProps, "value">;

export const useFilePicker = (props: IFilePickerPrimitiveProps) => {
    const params: FilePickerPresenterParams = useMemo(
        () => ({
            value: props.value
        }),
        [props.value]
    );

    const presenter = useMemo(() => {
        return new FilePickerPresenter();
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
        vm
    };
};
