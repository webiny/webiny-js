import { useFeature } from "@webiny/app-admin";
import { ThemesFeature } from "~/features/themes/index.js";

/** The bridge between the MobX repository and React. Components observe it via `observer`. */
export const useThemes = () => {
    const { repository } = useFeature(ThemesFeature);
    return repository;
};
