import { useIconPickerConfig } from "./config";
import { iconRepositoryFactory } from "./domain";

export const useIconRepository = () => {
    const { iconPackProviders } = useIconPickerConfig();

    return iconRepositoryFactory.getRepository(iconPackProviders);
};
