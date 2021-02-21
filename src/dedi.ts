import { makeRequest } from './request'
import { parseHTML } from 'linkedom'
import qs from 'querystring'
import { promisify } from 'util'
import * as R from 'remeda'

const wait = promisify(setTimeout)

export const getSince = async (since: number, top: number = 10) => {
    const [lasUpdateAt, uids] = await getUids(since)

    return [lasUpdateAt, readTracks(uids, since, top)] as const
}

const readTracks = async function* (uids: Array<[string, string, string]>, since: number, top: number) {
    for (const [track, author, uid] of uids) {
        await wait(200)
        const recs = await getRecs(uid, since, top)
        if (recs.length) yield [track, author, recs] as const
    }
}

const getRecs = async (uid: string, since: number, top: number) => {
    const res = await request(qs.stringify({ Uid: uid, Show: 'RECORDS' }))

    const { document } = parseHTML(await res.text())
    const rows = getRows(document).map(tr => readRow(tr) || [])

    let maxVipPos = -1
    let minRecPos = top + 1
    const recs = rows.map(([,, login, name, rankS,, time,,,,,, at]) => {
        const rank = Number(rankS)
        if (VIPs.includes(login)) maxVipPos = Math.max(maxVipPos, rank)

        if (rank > top || Date.parse(at) < since) return

        minRecPos = Math.min(minRecPos, rank)
        return [login, name, rank, time]
    }).filter(Boolean) as Array<[string, string, number, string]>

    if (minRecPos > maxVipPos) return []
    return recs.filter(([,, rank]) => rank <= maxVipPos)
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
