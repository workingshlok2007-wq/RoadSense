import { useMemo, useState } from "react"
import { Building2, TrendingDown, Truck } from "lucide-react"
import { corridors } from "../data/mockData"
import { Badge, Card, Heading } from "../components/ui"
export default function CorridorsPage() {
  const [weights, setWeights] = useState({
    business: 25,
    foot: 20,
    delivery: 20,
    severity: 25,
    sla: 10,
  })
  const ranked = useMemo(
    () =>
      corridors
        .map((c) => ({
          ...c,
          score: Math.round(
            (c.business * weights.business +
              c.foot * weights.foot +
              c.delivery * weights.delivery +
              c.severity * weights.severity +
              c.sla * weights.sla) /
              100,
          ),
        }))
        .sort((a, b) => b.score - a.score),
    [weights],
  )
  return (
    <>
      <Heading sub="Direct repairs where road failures create the greatest civic and economic impact">
        Commercial corridor priority
      </Heading>
      <div className="grid-2">
        <Card>
          <h2>Priority model weights</h2>
          {Object.entries(weights).map(([k, v]) => (
            <label className="slider" key={k}>
              <span>
                {k}
                <b>{v}%</b>
              </span>
              <input
                type="range"
                min="0"
                max="40"
                value={v}
                onChange={(e) =>
                  setWeights({ ...weights, [k]: +e.target.value })
                }
              />
            </label>
          ))}
        </Card>
        <Card className="impact">
          <div className="spread">
            <div>
              <Badge tone="success">Modeled estimate</Badge>
              <h2>{ranked[0].name}</h2>
            </div>
            <Building2 />
          </div>
          <div>
            <span>
              <Truck />
              Delivery delay<b>26 → 11 min</b>
            </span>
            <span>
              <TrendingDown />
              Affected merchants<b>84 → 31</b>
            </span>
          </div>
          <p>Impact after moving this corridor to the top repair position.</p>
        </Card>
      </div>
      <Card>
        <div className="spread">
          <h2>Live priority matrix</h2>
          <Badge tone="blue">Top rank: {ranked[0].name}</Badge>
        </div>
        <div className="table-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th>Rank / corridor</th>
                <th>Business density</th>
                <th>Foot traffic</th>
                <th>Delivery routes</th>
                <th>Hazard severity</th>
                <th>Hazard count</th>
                <th>SLA age</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr key={c.name}>
                  <td>
                    <b>
                      #{i + 1} {c.name}
                    </b>
                  </td>
                  {[
                    c.business,
                    c.foot,
                    c.delivery,
                    c.severity,
                    c.count,
                    c.sla,
                  ].map((v, j) => (
                    <td key={j}>
                      <span
                        className="heat"
                        style={{ opacity: 0.45 + Math.min(v, 100) / 180 }}
                      >
                        {v}
                        {j === 4 ? "" : "%"}
                      </span>
                    </td>
                  ))}
                  <td>
                    <b>{c.score}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
