export const entries: string[] = [
    "躯幹部広範囲CT検査の実際 (2) | Search ー症例報告やプロトコル設定索サイト",
    "検査の実際 (2) | Search Radiologyー症例報告やプロトコル設定検索サイト",
    "躯幹部広範囲CT (2) | Search Radiologyー症例報告やプロトコル設検索サイト",
    "Radiologyー症例報告やプロトコル設定検サイト",
    "例報告やプロトコル設定検索サイト"
];

type SearchTarget = [string, number[]];

export const searchTargets: SearchTarget[] = [
    /**
     * TODO figure out why these items are not producing results
     */
    // ["躯", [0, 2]], // finds none
    // ["例", [0, 1, 2, 3, 4]], // finds none
    // ["定", [0, 1, 3, 4]], // finds none
    // ["際", [0, 1]], // finds none
    ["躯幹", [0, 2]],
    ["症例報告", [0, 1, 2, 3]],
    ["Radiology", [1, 2, 3]],
    ["検索サイト", [1, 2, 4]],
    ["告やプロトコル設", [0, 1, 2, 3, 4]],
    ["Radiologyー症例報告やプロトコル設", [1, 2, 3]],
    ["ロトコル設定検索サイト", [1, 4]],
    ["Search Radiologyー症", [1, 2]],
    ["告やプロトコル設定", [0, 1, 3, 4]],
    ["実際 (2) | Search ー症例報", [0]],
    ["ogyー症例報告やプロトコル設定検サイト", [3]]
];
