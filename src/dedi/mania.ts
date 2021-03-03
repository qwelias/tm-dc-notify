import { makeRequest } from '../request'
import { parseHTML } from 'linkedom'
import qs from 'querystring'
import { promisify } from 'util'
import * as config from '../config'

const wait = promisify(setTimeout)

export const getNews = async () => {
    const since = config.dedi.lastUpdateAt
    const updates = await getUpdates(since)
    if (!updates.length) return []

    config.dedi.lastUpdateAt = updates[0].at
    config.write()

    return readTracks(updates, since)
}

const getUpdates = async (since: number) => {
    const res = await request(qs.stringify({
        MapOrder: 'DATE-DESC',
        Show: 'MAPS',
    }))

    const { document } = parseHTML(await res.text())
    const rows = getRows(document)

    return rows.map(tr => {
        const [, name, env, author,,,,, uid, at] = readRow(tr) || []
        if (Date.parse(at) > since) return { env, name, author, uid, at: Date.parse(at) }
    }).filter(Boolean) as TrackUpdate[]
}

const readTracks = async function* (updates: TrackUpdate[], since: number) {
    for (const upd of updates) {
        await wait(200)
        const [url, recs = []] = await getRecs(upd.uid, since)
        if (recs.length) yield [url, upd, recs] as const
    }
}

const getRecs = async (uid: string, since: number) => {
    const res = await request(qs.stringify({
        Uid: uid,
        Show: 'RECORDS',
        RecOrder3: 'RANK-ASC',
    }))

    const { document } = parseHTML(await res.text())
    const rows = getRows(document).map(tr => readRow(tr) || [])

    const recs = rows.map(([,, login, nick, rank,, time, mode,,,,, at]) => ({
        mode,
        rank: Number(rank),
        login,
        nick,
        time,
        up: Date.parse(at) > since,
    })) as RecUpdate[]

    return [res.url, recs] as const
}

const getRows = (document: Document) =>
    Array.from(document.querySelectorAll('form[name=stats] table:nth-child(2) tr.tabl')).slice(1)

const readRow = (tr: Element) => tr.textContent?.split(/\n\s+/)

const request = makeRequest('http://dedimania.net/tmstats/?do=stat&', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    }
})

export type TrackUpdate = { env:string, name:string, author:string, uid:string, at:number }
export type RecUpdate = { mode:string, rank:number, login:string, nick:string, time:string, up:boolean }
