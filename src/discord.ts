import DC, { Channel, TextChannel } from 'discord.js'

let channel: TextChannel

export const send = async (text: string) => {
    console.log(text)
    return channel && channel.send(text).catch(console.warn)
}

const ded = (...args: any[]) => {
    console.error(...args)
    process.exit(1)
}

const client = new DC.Client();
client.once('disconnect', ded)
client.once('error', ded)
client.once('ready', () => {
    channel = client.channels.cache.get(process.env.CHANNEL as string) as TextChannel
});
client.login(process.env.TOKEN);

