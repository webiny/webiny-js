export declare interface SendEventParams {
    event: string;
    version?: string;
    properties: Record<string, any>;
}

export declare function sendEvent(params: SendEventParams): Promise<void>;

export declare function isEnabled(): boolean;
export declare function enable(): boolean;
export declare function disable(): boolean;
