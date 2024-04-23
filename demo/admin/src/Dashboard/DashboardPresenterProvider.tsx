import { createGenericContext } from "@webiny/app-admin";
import { DashboardPresenter } from "./DashboardPresenter";
import { observer } from "mobx-react-lite";

const { useHook, Provider } = createGenericContext<{ presenter: DashboardPresenter }>(
    "DashboardPresenter"
);

export const DashboardPresenterProvider = observer(Provider);
export const useDashboardPresenter = useHook;
