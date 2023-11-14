import { useIconPickerConfig } from "~/components/IconPicker/config";
import { iconRepositoryFactory } from "~/components/IconPicker/new/domain";

export const useIconRepository = (namespace: string) => {
    const config = useIconPickerConfig();

    return iconRepositoryFactory.getRepository(config, namespace);
};
