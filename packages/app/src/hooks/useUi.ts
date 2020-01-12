import { useContext } from "react";
import { UiContext, UiContextValue } from "./../contexts/Ui";

export const useUi = () => {
    return useContext(UiContext) as UiContextValue;
};
