export interface MoveBlockActionArgsType {
    source: {
        id: string;
        type: string;
        position: number;
    };
    target: {
        id: string;
        type: string;
        position: number;
    };
    rootElementId: string;
}
