import { useIconPickerConfig } from "./config";
import { iconRepositoryFactory } from "./domain";

export const useIconRepository = () => {
    const { iconTypes, iconPackProviders } = useIconPickerConfig();

    return iconRepositoryFactory.getRepository(iconTypes, iconPackProviders);
};
