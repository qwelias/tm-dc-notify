import './global'

import { init, sendEmbed, sendUpdate, fmt } from './discord'
import { poll } from './playerpage'
import { promisify } from 'util'
import * as config from './config'
import * as dedi from './dedi'

const run = async function* () {
    await config.read()

    dedi.config.handle(await init([
        process.env['F_CHANNEL'] as string,
        ...Object.keys(config.dedi.channels),
    ].filter(Boolean))).catch((reason) => {
        console.error(reason)
        process.exit(1)
    })

    while (true) yield Promise.all([
        friendsOnline(),
        newDedis(),
    ])
}

const newDedis = async () => {
    for await (const [url, track, allRecs] of await dedi.mania.getNews()) {
        for (const [chId, recs] of dedi.filter.perChannel(track, allRecs)) sendEmbed(
            chId,
            url,
            `${track.env}: ${fmt.ub(lrm+track.name)} by ${fmt.p(track.author)}`,
            recs.map(({ rank, login, nick, time, up, server }) =>
                `${fmt[up ? 'ub' : 'n']('#'+rank)}: ${fmt.b(lrm+nick)} ${fmt.p(login)} ${fmt[up ? 'ubi' : 'i'](time)} on ${fmt.p(server)}`
            ).join('\n'),
        ).catch(console.warn)
    }
}

const friendsOnline = ((lastVips: string[], VIPs: string[]) => async () => {
    const users = await poll().catch(console.error) || {}

    const msg = Object.entries(users).map(([login, { name, server }]) => {
        return `${fmt.b(lrm+name)} ${fmt.p(login)}`
        + (server ? ` on ${fmt.u(`tmtp://#join=${server}`)}` : '')
    }).join('\n')

    const liveVips = Object.keys(users).filter(u => VIPs.includes(u)).sort()
    sendUpdate(
        process.env['F_CHANNEL'] as string,
        msg || ':(',
        liveVips.some(u => !lastVips.includes(u))
    ).catch(console.warn)
    lastVips = liveVips
})([], process.env['F_VIPS']?.split(';') || [])

const wait = promisify(setTimeout)

const lrm = '\u200E'

;(async () => {
    for await (const iter of run()) await wait(5000, iter)
})().catch((reason) => {
    console.error(reason)
    process.exit(1)
})

// after some time whole thing just hangs without any errors anywhere
// so kill it after a week, should get restarted
wait(1000*60*60*24*7).then(() => {
    process.exit(0)
})
