import { SystemUpgrade } from "../../src/types";
import { ContextInterface } from "@webiny/handler/types";

export interface DummyContext extends ContextInterface {
    applied: string[];
}

export const version500Beta1 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.1",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.1");
    }
});

export const version500Beta2 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.2",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.2");
    }
});

export const version500Beta3 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.3",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.3");
    }
});

export const version500Beta4 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.4",
    isApplicable: async context => {
        // pretend that if context version is 5.0.0-beta.4
        // we do some async call to check the db version and return false in that case
        if (context.WEBINY_VERSION === "5.0.0-beta.4") {
            return false;
        }
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.4");
    }
});

export const version500Beta5 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.5",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.5");
    }
});

export const version500Beta6 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0-beta.6",
    isApplicable: async () => {
        return false;
    },
    apply: async context => {
        context.applied.push("5.0.0-beta.6");
    }
});

export const version500 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.0",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.0");
    }
});

export const version501 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.1",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.1");
    }
});

export const version507 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.0.7",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.0.7");
    }
});

export const version510 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.1.0",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.1.0");
    }
});

export const version539 = (): SystemUpgrade<DummyContext> => ({
    type: "system-upgrade",
    version: "5.3.9",
    isApplicable: async () => {
        return true;
    },
    apply: async context => {
        context.applied.push("5.3.9");
    }
});
