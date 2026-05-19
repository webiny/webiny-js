import { useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { FilePickerPresenter, type FilePickerPresenterParams } from "./presenters/index.js";
import type { FilePickerPrimitiveProps } from "~/FilePicker/index.js";
import { useAdminUi } from "~/AdminUiProvider/index.js";

type IFilePickerPrimitiveProps = Pick<FilePickerPrimitiveProps, "value">;

export const useFilePicker = (props: IFilePickerPrimitiveProps) => {
    const { fileUrlFormatter } = useAdminUi();

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

    const formattedVm = useMemo(() => {
        if (!vm.file) {
            return vm;
        }
        return {
            ...vm,
            file: {
                ...vm.file,
                url: fileUrlFormatter.format(vm.file.url, { width: 128 })
            }
        };
    }, [vm, fileUrlFormatter]);

    return {
        vm: formattedVm
    };
};
