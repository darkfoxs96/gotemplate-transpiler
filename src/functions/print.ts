export function print(...args: any[]): string {
    let result = '';

    for (let arg of args) {
        if (typeof arg === 'string') {
            result += arg;
            continue;
        }
        if (arg?.toString) {
            result += ` ${arg.toString()}`;
            continue;
        }

        result += ` ${arg}`;
    }

    return result;
}
