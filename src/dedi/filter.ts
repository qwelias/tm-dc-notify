import * as R from 'remeda'
import * as config from '../config'
import { TrackUpdate, RecUpdate } from './mania'
import { ChannelDedi } from './config'

export function* perChannel({ env, uid }: TrackUpdate, allRecs: RecUpdate[]) {
    for (const [chId, cfg] of Object.entries(config.dedi.channels)) {
        if (
            !cfg.enabled ||
            (cfg.uids.length && !cfg.uids.includes(uid)) ||
            (cfg.env && cfg.env !== env)
        ) continue

        let recs = allRecs.filter(({ mode }) => mode === cfg.mode)
        if (recs.length < cfg.min_recs) continue

        recs = recs.slice(0, cfg.top)
        if (recs.every(({ up }) => !up)) continue

        if (!cfg.players.length) {
            recs = cfg.include_top ? recs : recs.filter(({ up }) => up)
            if (recs.length) yield [chId, recs] as const
            continue
        }

        const worthy = new Map()
        recs.reduceRight((pass, rec) => {
            if (cfg.players.includes(rec.login)) pass = true
            if (rec.up && pass) worthy.set(rec, true)
            return pass
        }, false)
        if (!worthy.size) continue

        recs = cfg.include_top ? recs : recs.filter(rec => worthy.get(rec))
        yield [chId, recs] as const
    }
}
