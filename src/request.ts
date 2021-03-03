import fetch, { RequestInit } from 'node-fetch'

/**
 * Make request function with baseUrl and baseOptions
 */
export const makeRequest = (baseUrl: string, baseOptions: RequestInit = {}) =>
    (url: string, options?: RequestInit, status?: number) =>
        request(
            baseUrl + url,
            {
                ...baseOptions,
                ...options,
                headers: { ...baseOptions.headers, ...options?.headers }
            },
            status,
        )

/**
 * Make request and throw on unexpected status code
 */
export const request = async (url: string, options?: RequestInit, status?: number) => {
    const res = await fetch(url, options)

    const ok = status != null ? res.status === status : res.ok
    if (!ok) throw Object.assign(
        new Error(res.statusText),
        {
            statusCode: res.status,
            req: { url, options },
            res: { headers: res.headers, text: await res.text() },
        },
    )

    return res
}

const applicationJson = 'application/json; charset=utf-8'
export const headers = {
    'json-json': { accept: applicationJson, 'content-type': applicationJson },
}
