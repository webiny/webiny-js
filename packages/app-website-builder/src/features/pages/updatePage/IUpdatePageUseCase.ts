export interface UpdatePageParams {
    id: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    bindings?: Record<string, any>;
    elements?: Record<string, any>;
    extensions?: Record<string, any>;
}

export interface IUpdatePageUseCase {
    execute: (params: UpdatePageParams) => Promise<void>;
}
