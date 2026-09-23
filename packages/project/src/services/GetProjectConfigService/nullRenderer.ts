import Reconciler from "react-reconciler";
import { DefaultEventPriority } from "react-reconciler/constants.js";

/*
 * A React renderer that renders to nothing.
 *
 * The project config is a React tree, but nothing in it is ever displayed. What we want is the data
 * the extensions register through `@webiny/react-properties` as they mount. Hooks, context, effects,
 * Suspense and error boundaries all live in React itself, so they work under any renderer. The host
 * config below only decides what to create for each element, and here the answer is: an empty object,
 * with every mutation a no-op.
 *
 * This replaced react-dom plus JSDOM, which were there only because react-dom needs `window` and
 * `document` to exist. Together they were about 1,300 modules on every CLI command.
 *
 * `react-reconciler` must match React's major version: 0.29 is React 18. Upgrading React means
 * upgrading this, and React 19's reconciler asks a few more things of the host config.
 */
const noop = () => {
    return;
};

type HostInstance = Record<string, never>;

const createHostInstance = (): HostInstance => {
    return {};
};

export const nullRenderer = Reconciler({
    supportsMutation: true,
    supportsPersistence: false,
    supportsHydration: false,
    supportsMicrotasks: true,
    isPrimaryRenderer: false,
    noTimeout: -1,

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    scheduleMicrotask: queueMicrotask,
    getCurrentEventPriority: () => DefaultEventPriority,

    getRootHostContext: () => ({}),
    getChildHostContext: (parentHostContext: object) => parentHostContext,

    createInstance: createHostInstance,
    createTextInstance: createHostInstance,
    getPublicInstance: (instance: HostInstance) => instance,
    finalizeInitialChildren: () => false,
    shouldSetTextContent: () => false,
    prepareUpdate: () => null,
    prepareForCommit: () => null,
    resetAfterCommit: noop,
    preparePortalMount: noop,

    appendInitialChild: noop,
    appendChild: noop,
    appendChildToContainer: noop,
    insertBefore: noop,
    insertInContainerBefore: noop,
    removeChild: noop,
    removeChildFromContainer: noop,
    clearContainer: noop,
    commitUpdate: noop,
    commitTextUpdate: noop,
    resetTextContent: noop,
    hideInstance: noop,
    unhideInstance: noop,
    hideTextInstance: noop,
    unhideTextInstance: noop,

    getInstanceFromNode: () => null,
    getInstanceFromScope: () => null,
    beforeActiveInstanceBlur: noop,
    afterActiveInstanceBlur: noop,
    prepareScopeUpdate: noop,
    detachDeletedInstance: noop
});
