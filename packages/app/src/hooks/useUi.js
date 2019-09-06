// @flow
import { useContext } from "react";
import { UiContext } from "./../contexts/Ui";

export const useUi = () => {
    return useContext(UiContext);
};
