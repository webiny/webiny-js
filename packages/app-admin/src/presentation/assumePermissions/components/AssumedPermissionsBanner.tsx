import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { useFeature } from "@webiny/app";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { AssumedPermissionsBanner as BaseAssumedPermissionsBanner } from "~/base/ui/AssumedPermissionsBanner.js";
import { AssumePermissionsPresenterFeature } from "../feature.js";

const MAIN_CONTENT_HEIGHT = "--spacing-main-content";

/*
 * Every view sizes itself with `h-main-content`, which is the window minus the header bar. The
 * banner sits above the header, so while it shows, that height has to lose the banner too, or the
 * whole page scrolls by exactly the banner's height. Measured rather than assumed, because the text
 * wraps to two lines on a narrow window.
 */
function useReserveBannerHeight(ref: React.RefObject<HTMLDivElement | null>): void {
    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const root = document.documentElement;
        const reserve = () => {
            const height = element.offsetHeight;
            root.style.setProperty(
                MAIN_CONTENT_HEIGHT,
                `calc(100vh - var(--spacing-header) - ${height}px)`
            );
        };

        reserve();
        const observer = new ResizeObserver(reserve);
        observer.observe(element);

        return () => {
            observer.disconnect();
            root.style.removeProperty(MAIN_CONTENT_HEIGHT);
        };
    }, [ref]);
}

interface BarProps {
    name: string;
    kind: string;
    switching: boolean;
    onExit: () => void;
}

/*
 * A slim bar across the content column, text centred and the action at the far right. Three
 * grid columns rather than an absolutely placed button, so a long role name wraps instead of
 * running under it.
 */
const Bar = ({ name, kind, switching, onExit }: BarProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useReserveBannerHeight(ref);

    return (
        <div
            ref={ref}
            className={"grid grid-cols-[1fr_auto_1fr] items-center gap-sm bg-warning px-sm py-xxs"}
            data-testid={"assumed-permissions-banner"}
        >
            <span />
            <Text size={"sm"} className={"text-center text-neutral-primary"}>
                {"Viewing the Admin as the "}
                <strong>{name}</strong>
                {` ${kind}. Permissions are enforced as this ${kind}, so anything you are not allowed to do will fail.`}
            </Text>
            <div className={"justify-self-end"}>
                <Button
                    variant={"ghost"}
                    size={"sm"}
                    text={"Exit preview"}
                    disabled={switching}
                    onClick={onExit}
                />
            </div>
        </div>
    );
};

/**
 * Stays on screen for as long as a preview is active, and is deliberately not dismissible: writes
 * fail while previewing, and someone who has lost the banner has no way to explain why.
 *
 * Rendered outside every permission gate, because the previewed role usually cannot see the menu
 * the preview was started from. Leaving it behind a gate would strand the user.
 */
const AssumedPermissionsBannerView = createReactiveComponent(() => {
    const { presenter } = useFeature(AssumePermissionsPresenterFeature);
    const vm = presenter.vm;

    if (!vm.assumed) {
        return null;
    }

    const kind = vm.assumed.type === "team" ? "team" : "role";

    return (
        <Bar
            name={vm.assumed.name}
            kind={kind}
            switching={vm.switching}
            onExit={() => presenter.exit()}
        />
    );
});

export const AssumedPermissionsBanner = BaseAssumedPermissionsBanner.createDecorator(() => {
    return function AssumedPermissionsBanner() {
        return <AssumedPermissionsBannerView />;
    };
});
