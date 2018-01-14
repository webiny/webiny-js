/**
 * RouterEvent instance is passed to all Router generated processes:
 * - beforeStart
 * - routeWillChange
 * - routeChanged
 * - routeNotMatched
 */
class RouterEvent {
    constructor(route, initialRender = false) {
        this.route = route;
        this.initialRender = initialRender;
        this.stopped = false;
        this.goTo = null;
        this.goToParams = null;
    }

    stop() {
        this.stopped = true;
        return this;
    }

    /**
     * Is this an initial app render or a subsequent render (when route changes)
     * @returns {boolean|*}
     */
    isInitialRender() {
        return this.initialRender;
    }

    isStopped() {
        return this.stopped;
    }

    goToRoute(route, params = null) {
        this.goTo = route;
        this.goToParams = params;
        return this;
    }
}

export default RouterEvent;
