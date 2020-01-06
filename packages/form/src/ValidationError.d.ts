declare class ValidationError extends Error {
    value: any;
    constructor(message: any, value?: any);
    getMessage(): string;
    getValue(): any;
}
export default ValidationError;
