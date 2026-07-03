import { makeAutoObservable, runInAction } from "mobx";
import { Clipboard as Abstraction, type IClipboardItem } from "./abstractions.js";

const BROADCAST_CHANNEL_NAME = "wby-clipboard";

class ClipboardServiceImpl implements Abstraction.Interface {
    private _item: IClipboardItem | null = null;

    constructor() {
        makeAutoObservable(this);
        this._initBroadcastListener();
    }

    get item(): IClipboardItem | null {
        return this._item;
    }

    copy(item: IClipboardItem): void {
        this._item = item;
        this._broadcast(item);
    }

    paste(): IClipboardItem | null {
        const item = this._item;
        this._item = null;
        this._broadcast(null);
        return item;
    }

    clear(): void {
        this._item = null;
        this._broadcast(null);
    }

    private _broadcast(payload: IClipboardItem | null): void {
        try {
            const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            channel.postMessage(payload);
            channel.close();
        } catch {
            // BroadcastChannel not supported — same-tab only.
        }
    }

    private _initBroadcastListener(): void {
        try {
            const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
            channel.onmessage = (event: MessageEvent) => {
                runInAction(() => {
                    this._item = event.data;
                });
            };
        } catch {
            // BroadcastChannel not supported.
        }
    }
}

export const ClipboardService = Abstraction.createImplementation({
    implementation: ClipboardServiceImpl,
    dependencies: []
});
