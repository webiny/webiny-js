import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        presets: [{ setupFiles: [`${import.meta.dirname}/__tests__/setup/setupDom.ts`] }],
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true,
            alias: [
                {
                    find: /^@webiny\/icons\/.+\.svg$/,
                    replacement: `${import.meta.dirname}/__tests__/setup/svgStub.tsx`
                }
            ]
        }
    });
};
