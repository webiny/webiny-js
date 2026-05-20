import React, { useEffect, useRef } from "react";
import { Button } from "~/Button/index.js";
import { ScrollArea } from "~/ScrollArea/index.js";
import { defaultYearRange } from "../../utils/dateHelpers.js";

interface YearGridProps {
    selectedYears: number[];
    onSelectYear: (year: number) => void;
    yearRange?: [number, number];
}

const YearGrid = ({ selectedYears, onSelectYear, yearRange }: YearGridProps) => {
    const [start, end] = yearRange ?? defaultYearRange();
    const years: number[] = [];
    for (let y = start; y <= end; y++) {
        years.push(y);
    }

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!scrollRef.current) {
            return;
        }
        const selectedEl = scrollRef.current.querySelector("[data-selected=true]");
        if (selectedEl) {
            selectedEl.scrollIntoView({ block: "center" });
        }
    }, []);

    return (
        <ScrollArea className="max-h-[280px]">
            <div ref={scrollRef} className="grid grid-cols-3 gap-xs p-sm">
                {years.map(year => {
                    const isSelected = selectedYears.includes(year);
                    return (
                        <Button
                            key={year}
                            variant={isSelected ? "primary" : "ghost"}
                            size="sm"
                            text={String(year)}
                            data-selected={isSelected}
                            onClick={() => onSelectYear(year)}
                        />
                    );
                })}
            </div>
        </ScrollArea>
    );
};

export { YearGrid, type YearGridProps };
