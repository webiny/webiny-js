// @vitest-environment happy-dom
import { createApp } from "vue";
import { createSSRApp } from "vue";
import { defineComponent } from "vue";
import { h } from "vue";
import { nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { observable } from "mobx";
import { runInAction } from "mobx";
import { useMobxTracking } from "./useMobxTracking.js";

const createStore = () => observable({ items: [] as string[] });

const createList = (store: ReturnType<typeof createStore>) => {
    return defineComponent({
        setup() {
            const mobx = useMobxTracking("Test");
            return () => {
                void mobx.version.value;
                const items = mobx.track(() => store.items.join(","));
                return h("p", items || "empty");
            };
        }
    });
};

describe("useMobxTracking", () => {
    it("re-renders when an observable read inside track() changes", async () => {
        const store = createStore();
        const el = document.createElement("div");
        const app = createApp(createList(store));
        app.mount(el);

        expect(el.innerHTML).toBe("<p>empty</p>");

        runInAction(() => store.items.push("a", "b"));
        await nextTick();

        expect(el.innerHTML).toBe("<p>a,b</p>");

        app.unmount();

        // The reaction is disposed with the component, so later changes do nothing.
        runInAction(() => store.items.push("c"));
        await nextTick();
        expect(el.innerHTML).toBe("");
    });

    it("renders the tracked value with renderToString", async () => {
        const store = createStore();
        store.items.push("server");
        const app = createSSRApp(createList(store));
        const html = await renderToString(app);

        expect(html).toBe("<p>server</p>");
    });

    it("rethrows an error thrown inside track()", () => {
        const mobx = useMobxTracking("Test");
        const fail = () => {
            throw new Error("Resolve failed.");
        };

        expect(() => mobx.track(fail)).toThrow("Resolve failed.");
    });
});
