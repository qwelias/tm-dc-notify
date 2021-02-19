import DE from 'dotenv'
DE.config()

import { send } from './discord'
import { poll, Player, hash } from './poll'

const VIPs = process.env.VIPS?.split(';') || []

setInterval(async () => {
    const users = await poll().catch(console.error) || {}

    for (const [k, v] of Object.entries(onlines))  {
        if (!(k in users)) {
            send(`- **${k}**`)
            delete onlines[k]
        }
    }

    for (const [k, v] of Object.entries(users)) {
        const msg = `**${k}** as ${'`'+v.name+'`'}`
            + (v.server ? ` on __tmtp://#join=${v.server}__` : '')

        if (!(k in onlines)) {
            send('+ ' + msg + (VIPs.includes(k) ? ' @here' : ''))
        } else if (onlines[k] !== hash(v)) {
            send('= ' + msg)
        }
        onlines[k] = hash(v)
    }
}, 5000)

const onlines: Record<string, string> = {}
