import DC, { TextChannel } from 'discord.js'

export const sendFriends = async (text: string, upd?: boolean) => {
    const msg = friendsChannel?.messages.cache.last()
    console.log(text)
    if (msg?.content === text) return

    if (!upd && msg) return msg?.edit(text)

    return Promise.all([
        msg?.delete(),
        channel?.send(text),
    ])
}

export const sendDedi = async (text: string) => {
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

