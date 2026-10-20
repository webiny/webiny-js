export interface Point {
    x: number;
    y: number;
}

// Turns points into a smooth SVG path (Catmull-Rom converted to cubic Bezier curves).
export function smoothPath(points: Point[]): string {
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const previous = points[Math.max(0, i - 1)];
        const current = points[i];
        const next = points[i + 1];
        const afterNext = points[Math.min(points.length - 1, i + 2)];

        const c1x = current.x + (next.x - previous.x) / 6;
        const c1y = current.y + (next.y - previous.y) / 6;
        const c2x = next.x - (afterNext.x - current.x) / 6;
        const c2y = next.y - (afterNext.y - current.y) / 6;
        path += ` C${c1x},${c1y} ${c2x},${c2y} ${next.x},${next.y}`;
    }
    return path;
}
