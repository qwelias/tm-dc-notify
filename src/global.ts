// gotta fucking fix TS myself every time cuse they live in a fucking wonderland

interface JSON {
    parse(text: string | Buffer, reviver?: (this: any, key: string, value: any) => any): any;
}

interface Promise<T> {
    finally(onfinally?: (() => any) | undefined | null): Promise<T>
}
