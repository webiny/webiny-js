let resizeQueue: Record<string, DOMRect> = {};
const onChangeListeners: Array<() => void> = [];

const flushResizeQueue = () => {
    if (Object.entries(resizeQueue).length > 0) {
        onChangeListeners.forEach(entry => {
            entry();
        });
    }
    resizeQueue = {};
};

let observer: any;

if (typeof ResizeObserver === "undefined") {
    observer = {
        observe: () => {},
        unobserve: () => {}
    };
} else {
    observer = new ResizeObserver(entries => {
        for (const entry of entries) {
            const el = entry.target as HTMLElement;
            const id = el.getAttribute("data-element-id");
            if (id) {
                resizeQueue[id] = el.getBoundingClientRect();
            }
        }
        requestAnimationFrame(flushResizeQueue);
    });
}

export const resizeObserver = {
    observe: (element: HTMLElement) => {
        observer.observe(element);
    },
    unobserve: (element: HTMLElement) => {
        observer.unobserve(element);
    },
    onChange: (cb: () => void) => {
        onChangeListeners.push(cb);
    }
};
