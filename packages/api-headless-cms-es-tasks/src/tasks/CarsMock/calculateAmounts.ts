interface ICalculateAmounts {
    amountOfTasks: number;
    amountOfRecords: number;
}

interface IMaxRecordsPerTask {
    amount: number;
    percentagePerTask: number;
}

const constrains: IMaxRecordsPerTask[] = [
    {
        amount: 1000,
        percentagePerTask: 100
    },
    {
        amount: 5000,
        percentagePerTask: 50
    },
    {
        amount: 50000,
        percentagePerTask: 20
    },
    {
        amount: 750000,
        percentagePerTask: 10
    },
    {
        amount: 1000000,
        percentagePerTask: 5
    },
    {
        amount: 5000000,
        percentagePerTask: 2
    },
    {
        amount: 10000000,
        percentagePerTask: 1
    }
];

const findValue = (input: number): IMaxRecordsPerTask => {
    for (const value of constrains) {
        if (input <= value.amount) {
            return value;
        }
    }
    throw new Error(`No valid value found - input value is too large: ${input}.`);
};

export const calculateAmounts = (input: number): ICalculateAmounts => {
    const values = findValue(input);

    const { percentagePerTask, amount } = values;
    /**
     * Do not ask...
     */
    const amountOfRecords =
        percentagePerTask < 100
            ? Math.round(parseFloat(String(input / (100 / percentagePerTask))))
            : input;

    const amountOfTasks = Math.ceil(100 / percentagePerTask);

    return {
        // values,
        amountOfRecords,
        // total,
        amountOfTasks
    };
};
