import { useRef, useState } from "react"
import {
  Camera,
  CheckCircle2,
  MapPin,
  Navigation,
  RotateCcw,
  Upload,
  X,
} from "lucide-react"
import { useDemo } from "../context/DemoContext"
import { Badge, Button, Card, Heading } from "../components/ui"

// Convert File → compressed Base64 Data URL (same approach as ReportPage)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let w = img.width,
          h = img.height
        const max = 1200
        if (w > max || h > max) {
          if (w > h) {
            h = Math.round((h * max) / w)
            w = max
          } else {
            w = Math.round((w * max) / h)
            h = max
          }
        }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          resolve(canvas.toDataURL("image/jpeg", 0.82))
        } else {
          resolve(e.target?.result as string)
        }
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function CrewPage() {
  const { reports, update } = useDemo()
  const task = reports.find((r) => r.status !== "Resolved") || reports[0]

  const [photo1, setP1] = useState(false),
    [photo2, setP2] = useState(false),
    [severity, setSeverity] = useState(""),
    [error, setError] = useState(false),
    [authorized, setAuthorized] = useState(false)

  // After-repair resolution state
  const [afterPhotoUrl, setAfterPhotoUrl] = useState<string | null>(null)
  const [afterPhotoName, setAfterPhotoName] = useState("")
  const [converting, setConverting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolved, setResolved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const ready = photo1 && photo2 && severity

  const upload = (which: 1 | 2) => {
    if (which === 2 && !error) {
      setError(true)
      return
    }
    which === 1 ? setP1(true) : setP2(true)
  }

  const auth = () => {
    setAuthorized(true)
    update(task.id, { status: "Crew Dispatched" })
  }

  const handleAfterPhotoFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setConverting(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      setAfterPhotoUrl(dataUrl)
      setAfterPhotoName(file.name)
    } catch {
      // ignore
    } finally {
      setConverting(false)
      e.target.value = ""
    }
  }

  const clearAfterPhoto = () => {
    setAfterPhotoUrl(null)
    setAfterPhotoName("")
  }

  const resolveTask = async () => {
    if (!afterPhotoUrl) return
    setResolving(true)
    await update(task.id, {
      status: "Resolved",
      resolvedAt: new Date().toISOString(),
      afterPhoto: afterPhotoUrl,
    })
    setResolving(false)
    setResolved(true)
  }

  return (
    <>
      <Heading sub="Guided, evidence-based verification for municipal field teams">
        Field crew simulator
      </Heading>
      <div className="crew-layout">
        <Card>
          <h2>Why two-step verification?</h2>
          <p>
            Road crews must capture both site context and a close-up measurement
            photo before heavy equipment can be authorized.
          </p>
          <div className="compliance">
            <CheckCircle2 />
            Chain-of-custody evidence is shared with Operations and the Triage
            queue instantly.
          </div>
        </Card>
        <div className="phone">
          <div className="phone-top">
            <span>09:42</span>
            <b>RoadSense Crew</b>
            <Badge tone="success">Online</Badge>
          </div>
          <div className="phone-body">
            <div className="spread">
              <div>
                <small>Priority task</small>
                <h2>{task?.id}</h2>
              </div>
              <Badge tone="high">High</Badge>
            </div>
            <div className="address">
              <MapPin />
              <span>
                <b>Market Avenue, Central</b>
                <small>Outside Civic Arcade · 0.4 km</small>
              </span>
            </div>
            <Button className="nav-btn">
              <Navigation /> Start navigation
            </Button>
            <div className="verify">
              <h3>1. On-site context photo</h3>
              <p>Show the hazard and surrounding carriageway.</p>
              <Button
                className={photo1 ? "done-btn" : "upload-btn"}
                onClick={() => upload(1)}
              >
                <Camera />
                {photo1 ? "Photo captured" : "Capture photo"}
              </Button>
            </div>
            <div className="verify">
              <h3>2. Secondary verification</h3>
              <p>Close-up with depth and width reference.</p>
              {error && !photo2 ? (
                <div className="upload-error">
                  <b>Upload interrupted</b>
                  <span>Check connection, then retry.</span>
                  <Button
                    onClick={() => {
                      setError(false)
                      setP2(true)
                    }}
                  >
                    <RotateCcw />
                    Retry
                  </Button>
                </div>
              ) : (
                <Button
                  className={photo2 ? "done-btn" : "upload-btn"}
                  onClick={() => upload(2)}
                >
                  <Camera />
                  {photo2 ? "Verification photo added" : "Add second photo"}
                </Button>
              )}
              <label>
                Severity decision
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="">Select required decision</option>
                  <option>Confirm</option>
                  <option>Upgrade</option>
                  <option>Downgrade</option>
                </select>
              </label>
              <div className="measure">
                <label>
                  Depth (mm)
                  <input type="number" defaultValue="42" />
                </label>
                <label>
                  Width (cm)
                  <input type="number" defaultValue="68" />
                </label>
              </div>
            </div>
            {!ready && (
              <p className="disabled-reason">
                Add both required photos and confirm severity to authorize
                equipment.
              </p>
            )}
            <Button
              className="authorize"
              disabled={!ready || authorized}
              onClick={auth}
            >
              {authorized
                ? "Equipment authorized ✓"
                : "Authorize heavy equipment"}
            </Button>

            {/* ── After-repair resolution flow ── */}
            {authorized && !resolved && (
              <div className="after-repair-section">
                <div className="after-repair-header">
                  <Camera />
                  <span>
                    <b>3. After-repair photo</b>
                    <small>
                      Upload a photo of the filled pothole to mark as complete
                      and remove it from the live map.
                    </small>
                  </span>
                </div>

                {!afterPhotoUrl ? (
                  <div className="after-photo-actions">
                    <label className="after-photo-btn">
                      <Camera />
                      Take photo
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={handleAfterPhotoFile}
                        ref={fileInputRef}
                      />
                    </label>
                    <label className="after-photo-btn secondary">
                      <Upload />
                      Upload
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleAfterPhotoFile}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="after-photo-preview">
                    <img src={afterPhotoUrl} alt="After repair" />
                    <button
                      className="after-photo-remove"
                      onClick={clearAfterPhoto}
                      aria-label="Remove after photo"
                    >
                      <X />
                    </button>
                    <small className="after-photo-name">{afterPhotoName}</small>
                  </div>
                )}

                {converting && (
                  <p className="disabled-reason">Processing photo…</p>
                )}

                <Button
                  className="repair"
                  disabled={!afterPhotoUrl || converting || resolving}
                  onClick={resolveTask}
                >
                  <CheckCircle2 />
                  {resolving
                    ? "Submitting…"
                    : "Submit & resolve — remove from map"}
                </Button>
              </div>
            )}

            {/* ── Resolved confirmation ── */}
            {resolved && (
              <div className="resolved-confirm">
                <CheckCircle2 />
                <div>
                  <b>Pothole marked as resolved!</b>
                  <small>
                    Removed from live map · added to Works Done Recently
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
