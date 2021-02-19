import DE from 'dotenv'
DE.config()

import { send } from './discord'
import { poll, Player, hash } from './poll'

setInterval(async () => {
    const users = await poll().catch(console.error) || {}

    for (const [k, v] of Object.entries(onlines))  {
        if (!(k in users)) {
            console.log('-', k)
            send(`- **${k}**`)
            delete onlines[k]
        }
    }

    for (const [k, v] of Object.entries(users)) {
        const msg = `**${k}** as ${'`'+v.name+'`'}`
            + (v.server ? ` on tmtp://#join=${v.server}` : '')

        if (!(k in onlines)) {
            console.log('+', k, v)
            send('+ ' + msg)
        } else if (onlines[k] !== hash(v)) {
            console.log('=', k, v)
            send('= ' + msg)
        }
        onlines[k] = hash(v)
    }
}, 5000)

const onlines: Record<string, string> = {}
