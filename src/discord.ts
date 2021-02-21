import DC, { TextChannel } from 'discord.js'

export const sendFriends = async (text: string, upd?: boolean) => {
    if (process.env.NODE_ENV !== 'production') return console.log(text, upd)

    const msg = friendsChannel?.messages.cache.last()
    if (msg?.content === text) return

    if (!upd && msg) return msg?.edit(text)

    return Promise.all([
        msg?.delete(),
        friendsChannel?.send(text),
    ])
}

export const sendDedi = async (text: string) => {
    if (process.env.NODE_ENV !== 'production') return console.log(text)

    return dedisChannel.send(text)
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
    dedisChannel = client.channels.cache.get(process.env.DEDIS_CHANNEL as string) as TextChannel
    friendsChannel = client.channels.cache.get(process.env.FRIENDS_CHANNEL as string) as TextChannel
    await friendsChannel.messages.fetch()
});
client.login(process.env.TOKEN);

