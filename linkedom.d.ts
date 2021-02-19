declare module 'linkedom' {
    export function parseHTML(html: string): {
        window: Window,
        document: Document,
    }
}
