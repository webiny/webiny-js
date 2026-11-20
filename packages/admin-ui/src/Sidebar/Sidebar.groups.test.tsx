// @vitest-environment jsdom
/**
 * A menu group's button says whether it's open: `aria-expanded` reaches the
 * element. A group is a Collapsible trigger (`asChild`), and its button used to
 * drop what the trigger gave it — assistive tech and scripted UI checks couldn't
 * tell an open group from a closed one, and a click only toggled it.
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { AdminUiProvider } from "~/AdminUiProvider/AdminUiProvider.js";
import { SidebarProvider } from "~/Sidebar/components/SidebarProvider.js";
import { Sidebar } from "~/Sidebar/index.js";

/* No SVG transform in the test runner. */
vi.mock("@webiny/icons/assignment.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/car_rental.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/chat.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/check_box.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/chrome_reader_mode.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/expand.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/gite.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/info.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/insert_drive_file.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/keyboard_arrow_down.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/keyboard_arrow_right.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/more_vert.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/push_pin.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/push_pin_off.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/summarize.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/swap_horiz.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/table_chart.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/web.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/width_full.svg", () => ({ ReactComponent: () => null }));

beforeAll(() => {
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
    window.matchMedia ??= ((q: string) => ({
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        onchange: null,
        dispatchEvent: () => false
    })) as unknown as typeof window.matchMedia;
});

afterEach(cleanup);

const Menu = () => {
    const [state, setState] = React.useState({
        pinned: true,
        expandedSections: [] as string[],
        pinnedItems: [] as string[]
    });
    return (
        <AdminUiProvider>
            <SidebarProvider state={state} onChangeState={setState}>
                <Sidebar title={"Webiny"}>
                    <Sidebar.Item text={"Website Builder"}>
                        <Sidebar.Link text={"Layouts"} to={"/website-builder/layouts"} />
                    </Sidebar.Item>
                </Sidebar>
            </SidebarProvider>
        </AdminUiProvider>
    );
};

describe("a sidebar group", () => {
    it("carries aria-expanded on its button, and it follows the group", () => {
        render(<Menu />);
        const group = screen.getByRole("button", { name: "Website Builder" });
        expect(group.getAttribute("aria-expanded")).toBe("false");
        act(() => group.click());
        expect(group.getAttribute("aria-expanded")).toBe("true");
        expect(group.getAttribute("aria-controls")).toBeTruthy();
    });
});
