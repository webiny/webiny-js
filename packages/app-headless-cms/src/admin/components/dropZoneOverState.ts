type Subscriber = (isOver: boolean) => void;

const subscribers = new Set<Subscriber>();
let activeCount = 0;

export const notifyDropZoneOver = (isOver: boolean) => {
    activeCount = isOver ? activeCount + 1 : Math.max(0, activeCount - 1);
    const state = activeCount > 0;
    subscribers.forEach(fn => fn(state));
};

export const subscribeToDropZoneOver = (fn: Subscriber) => {
    subscribers.add(fn);
    return () => {
        subscribers.delete(fn);
    };
};
