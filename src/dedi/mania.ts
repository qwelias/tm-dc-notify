import { makeRequest } from '../request'
import { parseHTML } from 'linkedom'
import qs from 'querystring'
import { promisify } from 'util'
import * as config from '../config'
import * as R from 'remeda'
import type { Response } from 'node-fetch'

const wait = promisify(setTimeout)

export const getNews = async () => {
    const since = config.dedi.lastUpdateAt
    const updates = await getUpdates(since)
    if (!updates.length) return []
    // @ts-ignore
    config.dedi.lastUpdateAt = updates[0].at
    config.write()

    return readTracks(updates, since)
}

const getUpdates = async (since: number) => {
    const updates = await request(qs.stringify({
        MapOrder: 'DATE-DESC',
        Show: 'MAPS',
    })).then(parseRecords)

    return updates.map(([, name, env, author,,,,, uid, at]) => {
        if (Date.parse(at || '') <= since) return null
        return {
            env,
            name,
            author,
            uid,
            at: Date.parse(at || ''),
        }
    }).filter(Boolean) as TrackUpdate[]
}

const readTracks = async function* (updates: TrackUpdate[], since: number) {
    for (const upd of updates) {
        await wait(200)
        const [url, recs] = await getRecs(upd.uid, since)
        if (recs.length) yield [url, upd, recs] as const
    }
}

const getRecs = async (uid: string, since: number) => {
    let url = ''
    const [records, record] = await Promise.all([
        request(qs.stringify({
            Uid: uid,
            Show: 'RECORDS',
            RecOrder3: 'RANK-ASC',
        })).then((r: Response) => ((url = r.url), r)).then(parseRecords),
        request(qs.stringify({
            Uid: uid,
            Show: 'RECORD',
        })).then(parseRecords)
    ])

    return [url, records.map(([,, login, nick, rank,, time, mode,,,,, at]) => {
        const [,,,,,,, server] = record.find(([,,, rLogin,, rMode]) => rLogin === login && rMode === mode) || []
        return {
            mode,
            rank: Number(rank),
            login,
            nick,
            time,
            server,
            up: Date.parse(at || '') > since,
        } as RecUpdate
    })] as const
}

const parseRecords = (r: Response) => r.text().then(R.createPipe(
    parseHTML,
    getRows,
    R.map(readRow),
))

const getRows = ({ document }: Window) =>
    Array.from(document.querySelectorAll('form[name=stats] table:nth-child(2) tr.tabl')).slice(1)

const readRow = (tr: Element) => tr.textContent?.split(/\n\s+/) || []

const request = makeRequest('http://dedimania.net/tmstats/?do=stat&', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    }
})

export type TrackUpdate = { env:string, name:string, author:string, uid:string, at:number }
export type RecUpdate = { mode:string, rank:number, login:string, nick:string, time:string, up:boolean, server:string }
