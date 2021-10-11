// Provides a way to check whether the `PageElementsProvider` React component was mounted or not,
// in a non-React context. In React contexts, it's strongly recommended the value of `usePageElements`
// React hook is checked instead (a `null` value means the provider React component wasn't mounted).
let usingPageElementsFlag = false;

export const usingPageElements = () => {
    return usingPageElementsFlag;
};

export const setUsingPageElements = (value: boolean) => {
    usingPageElementsFlag = value;
};
