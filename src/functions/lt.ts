const fnName = 'lt';

export function lt<T>(...args: T[]): boolean {
    if (!args?.length) {
        throw `${fnName}: there is not a single argument`;
    }
    if (args.length % 2 !== 0) {
        throw `${fnName}: there must be a paired number of arguments`;
    }

    const pairsCount = args.length / 2;
    if (pairsCount === 1) {
        return args[0] < args[1];
    }

    for (let i = 0; i < pairsCount; i++) {
        if (args[i] >= args[i + 1]) {
            return false;
        }
    }

    return true;
}
