import React from "react";
import { Button } from "~/Button/index.js";
import { MONTH_NAMES_SHORT } from "../../utils/constants.js";

interface MonthGridProps {
    selectedMonths: number[];
    onSelectMonth: (month: number) => void;
}

const MonthGrid = ({ selectedMonths, onSelectMonth }: MonthGridProps) => {
    return (
        <div className="grid grid-cols-3 gap-xs p-sm">
            {MONTH_NAMES_SHORT.map((name, index) => {
                const isSelected = selectedMonths.includes(index);
                return (
                    <Button
                        key={name}
                        variant={isSelected ? "primary" : "ghost"}
                        size="sm"
                        text={name}
                        onClick={() => onSelectMonth(index)}
                    />
                );
            })}
        </div>
    );
};

export { MonthGrid, type MonthGridProps };
