import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createModel } from "./helpers";
import {
    createNumbersEntryMutation,
    createNumbersModel,
    getNumbersEntryQuery
} from "./mocks/numbersModel";

const integerValue = 1234567890111213;
const float2Value = 0.04;
const float5Value = 0.00506;
const float6Value = 0.008107;
const float7Value = 0.0902078;
const float8Value = 0.00100289;
const float9Value = 0.000810091;
const float10Value = 0.1081040508;
const float11Value = 0.00070060008;
const float12Value = 0.300700700108;
const float13Value = 0.0007007005008;
const float14Value = 0.01070070050078;
const float15Value = 0.062900000982458;
// eslint-disable-next-line
const float20Value = 0.02753098762000982458;

describe("numbers model", () => {
    const handler = useGraphQLHandler({
        path: "manage/en-US"
    });

    beforeEach(async () => {
        await createModel({
            handler,
            createModelValues: createNumbersModel
        });
    });

    it("should create a numbers model, store and retrieve the entry", async () => {
        const [createResponse] = await handler.invoke(
            createNumbersEntryMutation({
                integer: integerValue,
                float2: float2Value,
                float5: float5Value,
                float6: float6Value,
                float7: float7Value,
                float8: float8Value,
                float9: float9Value,
                float10: float10Value,
                float11: float11Value,
                float12: float12Value,
                float13: float13Value,
                float14: float14Value,
                float15: float15Value,
                float20: float20Value
            })
        );
        expect(createResponse).toEqual({
            data: {
                createNumberModel: {
                    data: {
                        id: expect.stringMatching(/^([a-zA-Z0-9]+)#0001$/),
                        integer: integerValue,
                        float2: float2Value,
                        float5: float5Value,
                        float6: float6Value,
                        float7: float7Value,
                        float8: float8Value,
                        float9: float9Value,
                        float10: float10Value,
                        float11: float11Value,
                        float12: float12Value,
                        float13: float13Value,
                        float14: float14Value,
                        float15: float15Value,
                        float20: float20Value
                    },
                    error: null
                }
            }
        });

        const revision = createResponse.data.createNumberModel.data.id;
        const [getResponse] = await handler.invoke(getNumbersEntryQuery(revision));

        expect(getResponse).toEqual({
            data: {
                getNumberModel: {
                    data: {
                        id: revision,
                        integer: integerValue,
                        float2: float2Value,
                        float5: float5Value,
                        float6: float6Value,
                        float7: float7Value,
                        float8: float8Value,
                        float9: float9Value,
                        float10: float10Value,
                        float11: float11Value,
                        float12: float12Value,
                        float13: float13Value,
                        float14: float14Value,
                        float15: float15Value,
                        float20: float20Value
                    },
                    error: null
                }
            }
        });
    });
});
