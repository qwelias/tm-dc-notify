import DE from 'dotenv'
DE.config()

import { edit } from './discord'
import { poll, Player, hash } from './poll'

const VIPs = process.env.VIPS?.split(';') || []

setInterval(async () => {
    const users = await poll().catch(console.error) || {}

    const msg = Object.entries(users).map(([login, { name, server }]) => {
        return `**${login}** as ${'`'+name+'`'}`
        + (server ? ` on __tmtp://#join=${server}__` : '')
    }).join('\n')

    edit(msg || 'ded gaem').catch(console.warn)
}, 5000)
