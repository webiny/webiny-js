import React, { useRef } from "react";
import { useDrop } from "react-dnd";
import type { XYCoord } from "react-dnd";
import { Button, Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as DashboardCustomizeIcon } from "@webiny/icons/dashboard_customize.svg";
import { DASHBOARD_WIDGET_DND_TYPE, DashboardWidgetCard } from "./DashboardWidgetCard.js";
import { WidgetDropIndicator } from "./WidgetDropIndicator.js";
import type {
    DashboardDropTarget,
    DashboardLayoutPresenter
} from "../../dashboardLayout/presenter/abstractions.js";

interface DashboardWidgetColumnProps {
    columnIndex: number;
    /** Ordered widget names for this column (from the presenter's view model). */
    names: string[];
    draggingName: string | null;
    dropTarget: DashboardDropTarget | null;
    canRemoveColumn: boolean;
    elements: Map<string, React.ReactElement>;
    presenter: DashboardLayoutPresenter.Interface;
    onBrowseWidgets: () => void;
}

export const DashboardWidgetColumn = ({
    columnIndex,
    names,
    draggingName,
    dropTarget,
    canRemoveColumn,
    elements,
    presenter,
    onBrowseWidgets
}: DashboardWidgetColumnProps) => {
    // The whole column is one drop target. On hover we measure each card's midpoint to decide
    // which slot the pointer is nearest, so gaps (and the indicator itself) never miss a drop.
    const cardRefs = useRef(new Map<string, HTMLElement>());

    const registerRef = (name: string, node: HTMLElement | null) => {
        if (node) {
            cardRefs.current.set(name, node);
        } else {
            cardRefs.current.delete(name);
        }
    };

    const [, drop] = useDrop({
        accept: DASHBOARD_WIDGET_DND_TYPE,
        hover: (_item, monitor) => {
            const pointer = monitor.getClientOffset() as XYCoord | null;
            if (!pointer) {
                return;
            }
            let beforeName: string | null = null;
            for (const name of names) {
                const node = cardRefs.current.get(name);
                if (!node) {
                    continue;
                }
                const rect = node.getBoundingClientRect();
                if (pointer.y < rect.top + rect.height / 2) {
                    beforeName = name;
                    break;
                }
            }
            presenter.hoverSlot(columnIndex, beforeName);
        },
        drop: () => {
            presenter.drop();
        }
    });

    const isDragging = draggingName !== null;
    const showIndicatorBefore = (name: string | null) =>
        isDragging &&
        dropTarget !== null &&
        dropTarget.column === columnIndex &&
        dropTarget.beforeName === name;

    return (
        <div
            ref={node => {
                drop(node);
            }}
            className={"relative flex min-h-[120px] flex-1 flex-col gap-lg"}
            data-testid={`dashboard-column-${columnIndex}`}
        >
            {names.map(name => {
                const element = elements.get(name);
                if (!element) {
                    return null;
                }
                return (
                    <React.Fragment key={name}>
                        {showIndicatorBefore(name) ? <WidgetDropIndicator /> : null}
                        <DashboardWidgetCard
                            name={name}
                            isDragging={name === draggingName}
                            presenter={presenter}
                            registerRef={registerRef}
                        >
                            {element}
                        </DashboardWidgetCard>
                    </React.Fragment>
                );
            })}
            {showIndicatorBefore(null) ? <WidgetDropIndicator /> : null}
            {names.length === 0 && !showIndicatorBefore(null) ? (
                <ColumnEmptyState
                    canRemove={canRemoveColumn}
                    onRemove={() => presenter.removeColumn(columnIndex)}
                    onBrowse={onBrowseWidgets}
                />
            ) : null}
        </div>
    );
};

interface ColumnEmptyStateProps {
    canRemove: boolean;
    onRemove: () => void;
    onBrowse: () => void;
}

const ColumnEmptyState = ({ canRemove, onRemove, onBrowse }: ColumnEmptyStateProps) => {
    return (
        <div
            className={
                "flex min-h-[220px] flex-col items-center justify-center gap-sm rounded-lg " +
                "border-sm border-dashed border-neutral-strong/40 bg-neutral-base/50 p-lg " +
                "transition-colors hover:border-neutral-strong/60 hover:bg-neutral-base"
            }
        >
            <span
                className={"flex size-xl items-center justify-center rounded-md bg-neutral-dimmed"}
            >
                <Icon
                    icon={<DashboardCustomizeIcon />}
                    label={"Empty column"}
                    size={"sm"}
                    color={"neutral-strong"}
                />
            </span>
            <Text as={"div"} size={"sm"} className={"text-center text-neutral-strong"}>
                {"Drop a widget here"}
                <br />
                {"or "}
                <button
                    type={"button"}
                    onClick={onBrowse}
                    className={"cursor-pointer text-primary hover:underline"}
                >
                    {"browse widgets"}
                </button>
            </Text>
            {canRemove ? (
                <Button size={"sm"} variant={"ghost"} text={"Remove column"} onClick={onRemove} />
            ) : null}
        </div>
    );
};
