import { createAbstraction } from "@webiny/feature/admin";

export interface PreviewComponent {
    name: string;
    label: string;
    description: string;
}

export interface ILivePreviewPresenter {
    vm: {
        components: PreviewComponent[];
    };
    addComponent(component: PreviewComponent): void;
    clearComponents(): void;
}

export const LivePreviewPresenter = createAbstraction<ILivePreviewPresenter>(
    "CmsContentEntries/LivePreviewPresenter"
);

export namespace LivePreviewPresenter {
    export type Interface = ILivePreviewPresenter;
}
