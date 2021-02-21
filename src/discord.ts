import DC, { TextChannel } from 'discord.js'

const isProd = process.env.NODE_ENV === 'production'

export const sendFriends = async (text: string, upd?: boolean) => {
    if (!isProd) return console.log(text, upd)

    const msg = friendsChannel?.messages.cache.last()
    if (msg?.content === text) return

    if (!upd && msg) return msg?.edit(text)

    return Promise.all([
        msg?.delete(),
        friendsChannel?.send(text),
    ])
}

export const sendDedi = async (text: string) => {
    if (!isProd) return console.log(text)

    return dedisChannel?.send(text)
}

type StringLike = { toString(): string }
export const fmt = {
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


let friendsChannel: TextChannel
let dedisChannel: TextChannel

const ded = (...args: any[]) => {
    console.error(...args)
    process.exit(1)
}

const client = new DC.Client();
client.once('disconnect', ded)
client.once('error', ded)
client.once('ready', async () => {
    dedisChannel = client.channels.cache.get(process.env.D_CHANNEL as string) as TextChannel
    friendsChannel = client.channels.cache.get(process.env.F_CHANNEL as string) as TextChannel
    await friendsChannel.messages.fetch()
});
client.login(process.env.B_TOKEN);

