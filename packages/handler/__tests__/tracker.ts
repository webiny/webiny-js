export class TriggerTracker {
    private _context = 0;
    private _beforeHandler = 0;
    private _handler = 0;
    private _handlerResult = 0;
    private _handlerError = 0;

    public get context(): number {
        return this._context;
    }

    public get beforeHandler(): number {
        return this._beforeHandler;
    }

    public get handler(): number {
        return this._handler;
    }

    public get handlerResult(): number {
        return this._handlerResult;
    }

    public get handlerError(): number {
        return this._handlerError;
    }

    public triggerContext(): void {
        this._context++;
    }

    public triggerBeforeHandler(): void {
        this._beforeHandler++;
    }

    public triggerHandler(): void {
        this._handler++;
    }

    public triggerHandlerResult(): void {
        this._handlerResult++;
    }

    public triggerHandlerError(): void {
        this._handlerError++;
    }

    public reset(): void {
        this._context = 0;
        this._beforeHandler = 0;
        this._handler = 0;
        this._handlerResult = 0;
        this._handlerError = 0;
    }
}
