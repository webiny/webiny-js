export default function createMiddleware() {
    if (!window.Bugsnag) {
        console.error("Bugsnag is not available.");
        return ({ next, action }) => next(action);
    }

    return ({ store, next, action }) => {
        const state = store.getState();
        try {
            return next(action);
        } catch (err) {
            window.Bugsnag.notify(err, { action, state });
        }
    };
}
