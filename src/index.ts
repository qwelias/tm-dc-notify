import DE from 'dotenv'
DE.config()

import { sendFriends, sendDedi } from './discord'
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
    const now = Date.now()
    for await (const [track, author, recs] of getSince(since, 5)) {
        sendDedi([
            `Track: ${'`'+track+'`'} by **${author}**`,
            ...recs.map(
                ([username, name, rank, time]) => `**#${rank}** **${username}** as ${'`'+name+'`'} __*${time}*__`
            )
        ].join('\n')).catch(console.warn)
    }
    since = now
})(Date.now())

const friendsOnline = ((lastVips: string[], VIPs: string[]) => async () => {
    const users = await poll().catch(console.error) || {}

    const msg = Object.entries(users).map(([login, { name, server }]) => {
        return `**${login}** as ${'`'+name+'`'}`
        + (server ? ` on __tmtp://#join=${server}__` : '')
    }).join('\n')

    const liveVips = Object.keys(users).filter(u => VIPs.includes(u)).sort()
    sendFriends(
        msg || 'ded gaem',
        liveVips.some(u => !lastVips.includes(u))
    ).catch(console.warn)
    lastVips = liveVips
})([], process.env.VIPS?.split(';') || [])

const wait = promisify(setTimeout)

;(async () => {
    for await (const iter of run()) await wait(5000, iter)
})().catch((reason) => {
    console.error(reason)
    process.exit(1)
})
