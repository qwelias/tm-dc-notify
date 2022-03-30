import DC, { TextChannel, Intents } from 'discord.js'
import * as PE from 'p-event/index'

const isProd = process.env['NODE_ENV'] === 'production'
let client: DC.Client

export const init = async function* (channelIds: string[]) {
    client = new DC.Client({ intents: Intents.FLAGS.DIRECT_MESSAGES | Intents.FLAGS.GUILD_MESSAGES })
    client.once('disconnect', ded)
    client.once('error', ded)
    client.login(process.env['B_TOKEN'])
    await PE.default(client, 'ready')
    await Promise.all(channelIds.map(cacheChannel))

    yield* PE.iterator(client, 'message')
}

export const cacheChannel = (id: string) => client.channels.fetch(id)

export const sendUpdate = async (id: string, text: string, upd?: boolean) => {
    if (!isProd) return console.log(id, text, upd)
    const channel = client.channels.cache.get(id) as TextChannel
    if (!channel) return channel

    if (!channel.messages.cache.size) await channel.messages.fetch()

    const msg = channel.messages.cache.last()
    if (msg?.content === text) return

    if (!upd && msg) return msg?.edit(text)

    return Promise.all([
        msg?.delete(),
        channel?.send(text),
    ])
}

export const sendEmbed = async (id: string, url: string, title: string, description: string) => {
    if (!isProd) return console.log(id, url, title, description)

    if (description.length > 2000) { // description limit is 2000 chars
        const lastCaret = description.slice(0, 2000).lastIndexOf('\n')
        description = description.slice(0, lastCaret < 1 ? 2000 : lastCaret)
    }

    const channel = client.channels.cache.get(id) as TextChannel
    return channel?.send({ embeds: [{ url, title, description }] })
}

type StringLike = { toString(): string }
export const fmt = {
    n: (str: StringLike) => String(str),
    b: (str: StringLike) => `**${str}**`,
    p: (str: StringLike) => '`'+str+'`',
    i: (str: StringLike) => `*${str}*`,
    u: (str: StringLike) => `__${str}__`,
    s: (str: StringLike) => `~~${str}~~`,

    ui: (str: StringLike) => fmt.u(fmt.i(str)),
    ub: (str: StringLike) => fmt.u(fmt.b(str)),
    bi: (str: StringLike) => fmt.b(fmt.i(str)),
    ubi: (str: StringLike) => fmt.u(fmt.b(fmt.i(str))),
}

const ded = (...args: any[]) => {
    console.error(...args)
    process.exit(1)
}
