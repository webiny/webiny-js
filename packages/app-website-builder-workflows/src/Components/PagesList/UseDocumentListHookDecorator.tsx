import { useDocumentList } from "@webiny/app-website-builder/modules/pages/PagesList/useDocumentList.js";

export const UseDocumentListHookDecorator = useDocumentList.createDecorator(original => {
    return function useDocumentListWorkflows() {
        const hook = original();

        return {
            ...hook,
            vm: {
                ...hook.vm
                // data: hook.vm.data.map(item => {
                //     return item;
                // })
            }
        };
    };
});
