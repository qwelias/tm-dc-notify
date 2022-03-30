import { promises as fs } from 'fs'
import type { ChannelDedi } from './dedi/config'

export const dedi: {
    channels: { [channelId: string]: ChannelDedi },
    lastUpdateAt: number,
} = {
    channels: {},
    lastUpdateAt: Date.now(),
}

export const write = () => fs.writeFile(file, JSON.stringify({ dedi }, null, '    ')).catch(console.warn)
export const read = () => fs.readFile(file).then(JSON.parse).then(
    (c: { dedi: typeof dedi }) => Object.assign(dedi, c.dedi)
).catch(console.warn)

const file = './.config.json'
