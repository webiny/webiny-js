// Plain message: any validation or server error with nothing more to point at.
export interface MessageBannerState {
    kind: "message";
    message: string;
}

export interface DuplicateBannerState {
    kind: "duplicate";
    message: string;
    // The workflow the model already has, opened by Reload.
    workflowId: string;
    workflowName: string;
}

export interface TransportBannerState {
    kind: "transport";
}

// Private state of the presenter behind `vm.saveBanner`.
export type SaveBannerState = MessageBannerState | DuplicateBannerState | TransportBannerState;
