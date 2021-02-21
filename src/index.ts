import DE from 'dotenv'
DE.config()

import { sendFriends, sendDedi, fmt } from './discord'
import { poll } from './playerpage'
import { getSince } from './dedi'
import { promisify } from 'util'

const run = async function* () {
    while (true) yield Promise.all([
        friendsOnline(),
        newDedis(),
    ])
}

const newDedis = ((since: number) => async () => {
    const [lastUpdateAt, reader] = await getSince(since, Number(process.env.D_TOP))

    for await (const [track, author, recs] of reader) {
        sendDedi([
            `Track: ${fmt.b(track)} by ${fmt.p(author)}`,
            ...recs.map(
                ([login, name, rank, time]) => `${fmt.ub('#'+rank)} ${fmt.b(name)} (${fmt.p(login)}) ${fmt.ui(time)}`
            )
        ].join('\n')).catch(console.warn)
    }
    since = lastUpdateAt
})(Date.now() - 1000 * 60 * 5)

const friendsOnline = ((lastVips: string[], VIPs: string[]) => async () => {
    const users = await poll().catch(console.error) || {}

    const msg = Object.entries(users).map(([login, { name, server }]) => {
        return `${fmt.b(name)} (${fmt.p(login)})`
        + (server ? ` on ${fmt.u(`tmtp://#join=${server}`)}` : '')
    }).join('\n')

    const liveVips = Object.keys(users).filter(u => VIPs.includes(u)).sort()
    sendFriends(
        msg || ':(',
        liveVips.some(u => !lastVips.includes(u))
    ).catch(console.warn)
    lastVips = liveVips
})([], process.env.F_VIPS?.split(';') || [])

const wait = promisify(setTimeout)

;(async () => {
    for await (const iter of run()) await wait(5000, iter)
})().catch((reason) => {
    console.error(reason)
    process.exit(1)
})
