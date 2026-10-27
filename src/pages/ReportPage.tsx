import { useEffect, useRef, useState, type ChangeEvent } from "react"
import {
  Camera,
  Check,
  CircleAlert,
  Droplets,
  ImagePlus,
  LocateFixed,
  MapPin,
  OctagonAlert,
  ShieldAlert,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react"
import { LocationPicker } from "../components/LocationPicker"
import { Button, Card } from "../components/ui"
import { useReporter } from "../context/ReporterContext"
import type { Hazard, Severity } from "../data/mockData"

type PhotoItem = {
  dataUrl: string
  name: string
}

type CategoryItem = {
  value: Hazard
  label: string
  Icon: typeof Camera
}

const categories: CategoryItem[] = [
  { value: "pothole", label: "Pothole", Icon: OctagonAlert },
  {
    value: "surface water",
    label: "Waterlogging / standing water",
    Icon: Droplets,
  },
  { value: "crack", label: "Road crack", Icon: TriangleAlert },
  { value: "debris", label: "Debris on road", Icon: ShieldAlert },
  {
    value: "broken manhole cover",
    label: "Broken manhole cover",
    Icon: CircleAlert,
  },
  { value: "missing road sign", label: "Missing road sign", Icon: MapPin },
  { value: "other", label: "Other road hazard", Icon: ImagePlus },
]

type SeverityItem = {
  value: Severity
  label: string
  tone: string
}

const severities: SeverityItem[] = [
  { value: "Low", label: "Low (minor nuisance)", tone: "low" },
  { value: "Medium", label: "Medium (moderate damage/flow)", tone: "medium" },
  { value: "High", label: "High (urgent / dangerous)", tone: "high" },
]

const allowed = ["image/jpeg", "image/png", "image/webp"]

// Convert File to compressed Base64 Data URL so it saves permanently in MongoDB
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height
        const maxDim = 1200 // Max width/height to keep payload fast and light in MongoDB

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.82))
        } else {
          resolve(e.target?.result as string)
        }
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = (e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ReportPage() {
  const { submitReport } = useReporter()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [uploadError, setUploadError] = useState("")
  const [converting, setConverting] = useState(false)

  const [lat, setLat] = useState(18.512)
  const [lng, setLng] = useState(73.857)
  const [locationState, setLocationState] =
    useState<"idle" | "finding" | "found" | "denied">("idle")

  const [category, setCategory] = useState<Hazard | null>(null)
  const [severity, setSeverity] = useState<Severity>("Medium")
  const [description, setDescription] = useState("")

  const [reference, setReference] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const requested = useRef(false)

  useEffect(() => {
    if (step !== 2 || requested.current) return
    requested.current = true
    setLocationState("finding")
    if (!navigator.geolocation) {
      setLocationState("denied")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude)
        setLng(position.coords.longitude)
        setLocationState("found")
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [step])

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadError("")
    if (files.length === 0) return

    setConverting(true)
    const next: PhotoItem[] = []

    try {
      for (const file of files) {
        if (!allowed.includes(file.type)) {
          setUploadError("Only JPG, PNG, or WebP images can be added.")
          continue
        }
        if (file.size > 15 * 1024 * 1024) {
          setUploadError("Each photo must be 15MB or smaller.")
          continue
        }
        if (photos.length + next.length >= 3) {
          setUploadError("You can add up to 3 photos.")
          break
        }
        // Encode and compress to persistent Base64 Data URL
        const dataUrl = await fileToDataUrl(file)
        next.push({ dataUrl, name: file.name })
      }
      setPhotos((current) => [...current, ...next])
    } catch {
      setUploadError("Could not process photo. Please try another image.")
    } finally {
      setConverting(false)
      event.target.value = ""
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index))
  }

  const submit = async () => {
    if (!category) return
    setSubmitting(true)
    setSubmitError("")
    try {
      // Send base64 photos + details to be saved directly in MongoDB
      const refId = await submitReport({
        photos: photos.map((p) => p.dataUrl),
        category,
        lat,
        lng,
        severity,
        description,
      })
      setReference(refId)
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Report could not be sent. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const restart = () => {
    setPhotos([])
    setCategory(null)
    setSeverity("Medium")
    setDescription("")
    setReference("")
    setStep(1)
    setUploadError("")
    setSubmitError("")
    requested.current = false
  }

  if (reference) {
    return (
      <Card className="report-confirmation">
        <span className="confirmation-icon">
          <Check />
        </span>
        <h1>Report saved in database!</h1>
        <p>
          Your road report has been stored with reference ID{" "}
          <strong>{reference}</strong>.
        </p>
        <Button onClick={restart}>Report another issue</Button>
      </Card>
    )
  }

  return (
    <>
      <header className="report-heading">
        <p className="eyebrow">Municipal road reporting</p>
        <h1>Report a road inconvenience</h1>
        <p>
          Send photos and details to save into the municipal RoadSense database.
        </p>
      </header>

      <ol className="report-steps" aria-label={`Step ${step} of 4`}>
        {["Photos", "Location", "Details", "Review"].map((label, index) => (
          <li
            className={
              index + 1 === step ? "active" : index + 1 < step ? "complete" : ""
            }
            key={label}
          >
            <span>{index + 1 < step ? <Check /> : index + 1}</span>
            <small>{label}</small>
          </li>
        ))}
      </ol>

      <Card className="report-card">
        {step === 1 && (
          <section>
            <h2>Step 1: Add photos</h2>
            <p>
              Add 1 to 3 clear images of the pothole or road hazard (saved in
              database).
            </p>
            <div className="photo-actions">
              <label className="report-action">
                <Camera />
                Take photo
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={addPhotos}
                />
              </label>
              <label className="report-action secondary">
                <Upload />
                Upload from gallery
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={addPhotos}
                />
              </label>
            </div>
            <p className="field-note">
              {converting
                ? "Processing image for database…"
                : "JPG, PNG or WebP · saved directly to database"}
            </p>
            <div className="upload-message" aria-live="polite">
              {uploadError}
            </div>

            {photos.length > 0 && (
              <div className="photo-grid">
                {photos.map((photo, index) => (
                  <div key={index}>
                    <img
                      src={photo.dataUrl}
                      alt={`Selected road photo ${index + 1}`}
                    />
                    <Button
                      className="remove-photo"
                      onClick={() => removePhoto(index)}
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section>
            <h2>Step 2: Confirm location</h2>
            <p>
              Drag the pin or tap on the map to set the exact coordinates of the
              hazard.
            </p>
            <div className="location-status">
              <LocateFixed />
              <span>
                <b>
                  {locationState === "finding"
                    ? "Detecting GPS location…"
                    : locationState === "found"
                      ? "GPS location detected"
                      : "Map location selected"}
                </b>
                <small>
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </small>
              </span>
            </div>
            <div className="inline-notice">
              <CircleAlert />
              Click or drag the marker to refine the location.
            </div>
            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(a, b) => {
                setLat(a)
                setLng(b)
              }}
            />
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>Step 3: Hazard category &amp; details</h2>
            <p>Select the category that best describes the road issue.</p>
            <div className="category-grid">
              {categories.map(({ value, label, Icon }) => (
                <button
                  type="button"
                  className={category === value ? "selected" : ""}
                  aria-pressed={category === value}
                  onClick={() => setCategory(value)}
                  key={value}
                >
                  <Icon />
                  <span>{label}</span>
                  {category === value && <Check />}
                </button>
              ))}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <label
                style={{
                  display: "grid",
                  gap: "0.4rem",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                Severity Level
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as Severity)}
                  style={{
                    padding: "0.65rem 0.8rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    background: "white",
                    fontSize: "0.85rem",
                  }}
                >
                  {severities.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label
                style={{
                  display: "grid",
                  gap: "0.4rem",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                Additional Details / Landmark (optional)
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Near petrol pump, pothole is approximately 10cm deep and dangerous at night"
                  style={{
                    padding: "0.65rem 0.8rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #CBD5E1",
                    fontSize: "0.85rem",
                    resize: "vertical",
                    fontFamily: "inherit",
                  }}
                />
              </label>
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2>Step 4: Review and save to database</h2>
            <div className="review-row">
              <span>Photos</span>
              <b>{photos.length} attached (will be stored in DB)</b>
            </div>
            {photos.length > 0 && (
              <div className="review-thumbs">
                {photos.map((photo, index) => (
                  <img
                    src={photo.dataUrl}
                    alt={`Road photo ${index + 1}`}
                    key={index}
                  />
                ))}
              </div>
            )}
            <div className="review-row">
              <span>Category</span>
              <b>{categories.find((item) => item.value === category)?.label}</b>
            </div>
            <div className="review-row">
              <span>Severity</span>
              <b>{severity}</b>
            </div>
            <div className="review-row">
              <span>Location</span>
              <b>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </b>
            </div>
            {description && (
              <div className="review-row">
                <span>Details</span>
                <b>{description}</b>
              </div>
            )}
            <div className="privacy-note">
              <ShieldAlert />
              Photos and details will be saved to MongoDB (RoadSenseDB) and
              visible across the system.
            </div>
            <div className="upload-message" aria-live="polite">
              {submitError}
            </div>
            <Button
              className="submit-report"
              onClick={submit}
              disabled={submitting || converting}
            >
              {submitting ? "Saving to database…" : "Submit report"}
            </Button>
          </section>
        )}

        <div className="report-nav">
          {step > 1 && (
            <Button className="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 4 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && photos.length === 0) ||
                (step === 3 && !category) ||
                converting
              }
            >
              Continue
            </Button>
          )}
        </div>
      </Card>
    </>
  )
}
