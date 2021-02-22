import { makeRequest } from './request'
import { parseHTML } from 'linkedom'
import qs from 'querystring'
import { promisify } from 'util'
import * as R from 'remeda'

const MODE = process.env.D_MODE
const MIN_RECS = Number(process.env.D_MIN)

const wait = promisify(setTimeout)

export const getSince = async (since: number, top: number = 10) => {
    const [lasUpdateAt, uids] = await getUids(since)

    return [lasUpdateAt, readTracks(uids, since, top)] as const
}

const readTracks = async function* (uids: Array<[string, string, string]>, since: number, top: number) {
    for (const [track, author, uid] of uids) {
        await wait(200)
        const [url, recs = []] = await getRecs(uid, since, top)
        if (recs.length) yield [url, track, author, recs] as const
    }
}

const getRecs = async (uid: string, since: number, top: number) => {
    const res = await request(qs.stringify({
        Uid: uid,
        Show: 'RECORDS',
        RecOrder3: 'RANK-ASC',
    }))

    const { document } = parseHTML(await res.text())
    const rows = getRows(document).map(tr => readRow(tr) || [])

    let maxRank = -1
    let maxVipPos = -1
    let minRecPos = top + 1
    const recs = rows.map(([,, login, name, rankS,, time, mode,,,,, at]) => {
        if (mode !== MODE) return

        const rank = Number(rankS)
        maxRank = Math.max(maxRank, rank)

        if (VIPs.includes(login)) maxVipPos = Math.max(maxVipPos, rank)
        if (rank > top) return

        const up = Date.parse(at) > since
        if (up) minRecPos = Math.min(minRecPos, rank)
        return [rank, login, name, time, up]
    }).filter(Boolean) as Array<[number, string, string, string, string]>

    if (
        minRecPos > maxVipPos || // VIPs didnt move
        minRecPos > top || // insignificant record
        maxRank < MIN_RECS // track isnt hunted by enough players
    ) return []
    return [res.url, recs] as const
}

const getUids = async (since: number) => {
    const res = await request(qs.stringify({
        Envir: 'TMU-Island',
        MapOrder: 'DATE-DESC',
        Show: 'MAPS',
    }))

    const { document } = parseHTML(await res.text())
    const rows = getRows(document)
    const [,,,,,,,,, lastUpdateAt] = readRow(rows[0]) || []

    return [
        Date.parse(lastUpdateAt),
        rows.map(tr => {
            const [, track,, author,,,,, uid, at] = readRow(tr) || []
            if (Date.parse(at) > since) return [track, author, uid]
        }).filter(Boolean) as Array<[string, string, string]>,
    ] as const
}

const getRows = (document: Document) =>
    Array.from(document.querySelectorAll('form[name=stats] table:nth-child(2) tr.tabl')).slice(1)

const readRow = (tr: Element) => tr.textContent?.split(/\n\s+/)

const request = makeRequest('http://dedimania.net/tmstats/?do=stat&', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    }
})

const VIPs = process.env.D_VIPS?.split(';') || []
