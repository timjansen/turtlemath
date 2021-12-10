type RangeDef = [ number, number ];
type LevelDef = {
    lostProgressPerSecond: number, // this many progress pct are lost per second
    minNumberRange: RangeDef,           // the range for the lowest number in the task
    maxNumberRange: RangeDef,           // the range for the upper number in the task
    op: '+' | '-' | '*' | '/',
}

export const LEVELS: LevelDef[] = [
    {
        lostProgressPerSecond: 0.05,
        minNumberRange: [1, 5],
        maxNumberRange: [1, 5],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.05,
        minNumberRange: [1, 5],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.1,
        minNumberRange: [1, 5],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.2,
        minNumberRange: [1, 5],
        maxNumberRange: [5, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.05,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.4,
        minNumberRange: [1, 5],
        maxNumberRange: [1, 5],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.2,
        minNumberRange: [2, 5],
        maxNumberRange: [2, 5],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.05,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.1,
        minNumberRange: [2, 10],
        maxNumberRange: [2, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.2,
        minNumberRange: [2, 7],
        maxNumberRange: [2, 5],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.1,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.15,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.20,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.30,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.4,
        minNumberRange: [1, 10],
        maxNumberRange: [1, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.5,
        minNumberRange: [2, 10],
        maxNumberRange: [2, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.6,
        minNumberRange: [3, 10],
        maxNumberRange: [2, 10],
        op: '*'
    },
    {
        lostProgressPerSecond: 0.6,
        minNumberRange: [3, 9],
        maxNumberRange: [2, 10],
        op: '*'
    },
];
