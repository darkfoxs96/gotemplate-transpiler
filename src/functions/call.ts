const fnName = 'call';

export function call<T>(fn: (...args: any[]) => T, ...args: any[]): T {
    if (!fn || typeof fn !== 'function') {
        throw `${fnName}: functions is required`;
    }

    return fn(...args);
}
