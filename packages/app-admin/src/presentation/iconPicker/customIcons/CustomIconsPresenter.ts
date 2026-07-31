import { makeAutoObservable, runInAction } from "mobx";
import { ListCustomIconsGateway } from "~/features/iconPicker/listCustomIcons/abstractions.js";
import type { ICustomIcon } from "~/features/iconPicker/listCustomIcons/abstractions.js";
import {
    CustomIconsPresenter as Abstraction,
    type ICustomIconsPresenter,
    type ICustomIconsViewModel
} from "./abstractions.js";

class CustomIconsPresenterImpl implements ICustomIconsPresenter {
    private _loading = true;
    private _icons: ICustomIcon[] = [];
    private _initialized = false;

    constructor(private gateway: ListCustomIconsGateway.Interface) {
        makeAutoObservable<CustomIconsPresenterImpl, "gateway" | "_initialized">(this, {
            gateway: false,
            _initialized: false
        });
    }

    get vm(): ICustomIconsViewModel {
        return {
            loading: this._loading,
            icons: this._icons
        };
    }

    async load(): Promise<ICustomIcon[]> {
        if (this._initialized) {
            return this._icons;
        }
        this._initialized = true;

        const icons = await this.gateway.execute();
        runInAction(() => {
            this._icons = icons;
            this._loading = false;
        });
        return icons;
    }
}

export const CustomIconsPresenter = Abstraction.createImplementation({
    implementation: CustomIconsPresenterImpl,
    dependencies: [ListCustomIconsGateway]
});
