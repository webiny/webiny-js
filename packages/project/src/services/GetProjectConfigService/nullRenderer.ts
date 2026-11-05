import { createContext } from "react";
import Reconciler from "react-reconciler";
import { DefaultEventPriority, NoEventPriority } from "react-reconciler/constants.js";

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
 * `react-reconciler` must match React's major version: 0.34 is React 19. Upgrading React means
 * upgrading this. React 19's reconciler owns the update priority through the host config
 * (`setCurrentUpdatePriority` and friends) and asks about transitions and suspended commits; with
 * nothing to display, none of those ever wait or suspend.
 */
const noop = () => {
    return;
};

type HostInstance = Record<string, never>;

// React 19 hands the update priority to the renderer to keep. NoEventPriority means "none set".
let currentUpdatePriority: number = NoEventPriority;

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

    // Reported to React DevTools, which never attaches to this renderer.
    rendererVersion: "0.0.0",
    rendererPackageName: "@webiny/project-null-renderer",
    extraDevToolsConfig: null,
    // Replays a captured console call. Bound as is: there is no environment badge to add.
    bindToConsole: (methodName: string, args: unknown[]) => {
        const method = console[methodName as keyof Console] as (...values: unknown[]) => void;
        return method.bind(console, ...args);
    },

    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    scheduleMicrotask: queueMicrotask,
    setCurrentUpdatePriority: (priority: number) => {
        currentUpdatePriority = priority;
    },
    getCurrentUpdatePriority: () => currentUpdatePriority,
    resolveUpdatePriority: () => {
        if (currentUpdatePriority !== NoEventPriority) {
            return currentUpdatePriority;
        }
        return DefaultEventPriority;
    },
    resolveEventType: () => null,
    resolveEventTimeStamp: () => -1.1,
    shouldAttemptEagerTransition: () => false,
    trackSchedulerEvent: noop,
    requestPostPaintCallback: noop,
    NotPendingTransition: null,
    HostTransitionContext: createContext(null),
    resetFormInstance: noop,

    // Nothing is ever loaded or painted, so a commit never has to wait.
    maySuspendCommit: () => false,
    maySuspendCommitOnUpdate: () => false,
    maySuspendCommitInSyncRender: () => false,
    preloadInstance: () => true,
    startSuspendingCommit: noop,
    suspendInstance: noop,
    suspendOnActiveViewTransition: noop,
    waitForCommitToBeReady: () => null,
    getSuspendedCommitReason: () => null,

    getRootHostContext: () => ({}),
    getChildHostContext: (parentHostContext: object) => parentHostContext,

    createInstance: createHostInstance,
    createTextInstance: createHostInstance,
    getPublicInstance: (instance: HostInstance) => instance,
    finalizeInitialChildren: () => false,
    shouldSetTextContent: () => false,
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
