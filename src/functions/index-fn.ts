export function index<T>(obj?: any, ...keys: Array<string>): T | undefined {
    if (!obj) {
        return;
    }
    if (!keys?.length) {
        return obj;
    }

    let result = obj[keys[0]];
    keys = keys.slice(1);
    for (const key of keys) {
        if (!result) {
            return result;
        }

        result = result[key];
    }

    return result;
}
