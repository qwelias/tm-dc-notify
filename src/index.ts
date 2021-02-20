import DE from 'dotenv'
DE.config()

import { send } from './discord'
import { poll, Player, hash } from './poll'

const VIPs = process.env.VIPS?.split(';') || []

setInterval(async () => {
    const users = await poll().catch(console.error) || {}

    const msg = Object.entries(users).map(([login, { name, server }]) => {
        return `**${login}** as ${'`'+name+'`'}`
        + (server ? ` on __tmtp://#join=${server}__` : '')
    }).join('\n')

    const liveVips = Object.keys(users).filter(u => VIPs.includes(u)).sort()
    send(
        msg || 'ded gaem',
        liveVips.some(u => !lastVips.includes(u))
    ).catch(console.warn)
    lastVips = liveVips
}, 5000)

let lastVips: string[] = []
