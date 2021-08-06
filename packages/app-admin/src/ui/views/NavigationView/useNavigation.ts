import { useUi } from "@webiny/app/hooks/useUi";
import { get } from "lodash";
import { set } from "dot-prop-immutable";

export type UseNavigation = ReturnType<typeof useNavigation>;

export function useNavigation() {
    const ui = useUi();

    const hook = {
        showMenu: () => {
            ui.setState(ui => set(ui, "appsMenu.show", true));
        },
        hideMenu: () => {
            ui.setState(ui => set(ui, "appsMenu.show", false));
        },
        menuIsShown(): boolean {
            return get(ui, "appsMenu.show", false);
        }
    };

    return hook;
}
