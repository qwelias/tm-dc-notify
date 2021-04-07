interface JSON {
    parse(text: string | Buffer, reviver?: (this: any, key: string, value: any) => any): any;
}

interface Promise<T> {
    finally(onfinally?: (() => any) | undefined | null): Promise<T>
}
