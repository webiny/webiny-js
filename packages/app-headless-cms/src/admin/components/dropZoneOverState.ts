type Subscriber = (isOver: boolean) => void;

class DropZoneOverState {
    private subscribers = new Set<Subscriber>();
    private activeCount = 0;

    notify(isOver: boolean) {
        this.activeCount = isOver ? this.activeCount + 1 : Math.max(0, this.activeCount - 1);
        const state = this.activeCount > 0;
        this.subscribers.forEach(fn => fn(state));
    }

    subscribe(fn: Subscriber) {
        this.subscribers.add(fn);
        return () => {
            this.subscribers.delete(fn);
        };
    }
}

export const dropZoneOverState = new DropZoneOverState();
