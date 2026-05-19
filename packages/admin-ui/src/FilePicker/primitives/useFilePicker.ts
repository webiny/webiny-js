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
        try {
            const url = new URL(vm.file.url);
            fileUrlFormatter.format(url, { width: 128 });
            return { ...vm, file: { ...vm.file, url: url.toString() } };
        } catch {
            return vm;
        }
    }, [vm, fileUrlFormatter]);

    return {
        vm: formattedVm
    };
};
