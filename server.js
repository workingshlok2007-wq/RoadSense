import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"

// Load environment variables from .env
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/RoadSenseDB"

// ==========================================
// Middleware
// ==========================================
// Enable CORS for frontend requests (Vite dev server on localhost:8443, localhost:5173, etc.)
app.use(cors())

// Increase JSON and URL-encoded limits to 50MB so base64 pictures and photos save smoothly
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))

// ==========================================
// Mongoose Schema & Model: RoadTag
// ==========================================
const roadTagSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      index: true,
    },
    hazardType: {
      type: String,
      required: [
        true,
        "Hazard type is required (e.g., pothole, surface water, crack, debris)",
      ],
      trim: true,
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Reported", "Verified", "Crew Dispatched", "Resolved"],
      default: "Reported",
    },
    lat: {
      type: Number,
      required: [true, "Latitude (lat) is required"],
    },
    lng: {
      type: Number,
      required: [true, "Longitude (lng) is required"],
    },
    district: {
      type: String,
      default: "Central",
    },
    description: {
      type: String,
      default: "",
    },
    photo: {
      type: String, // Base64 data URL or external image URL
      default: "",
    },
    photos: {
      type: [String], // Array of base64 data URLs
      default: [],
    },
    confidence: {
      type: Number,
      default: 75,
    },
    priority: {
      type: Number,
      default: 50,
    },
    duplicates: {
      type: Number,
      default: 1,
    },
    clusterId: {
      type: String,
      default: "",
    },
    reportedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    slaDeadline: {
      type: String,
      default: () => new Date(Date.now() + 72 * 3600000).toISOString(),
    },
  },
  {
    timestamps: true,
    strict: false, // Allows any extra custom fields added in UI
  },
)

export const RoadTag = mongoose.model("RoadTag", roadTagSchema)

// Helper to format documents so frontend always has .id matching either tagId or _id
function formatTag(doc) {
  if (!doc) return null
  const obj = typeof doc.toObject === "function" ? doc.toObject() : { ...doc }
  obj.id = obj.tagId || String(obj._id)
  return obj
}

// ==========================================
// Initial Seed Data (if DB is empty)
// ==========================================
async function seedInitialDataIfEmpty() {
  try {
    const count = await RoadTag.countDocuments()
    if (count === 0) {
      console.log("🌱 Database is empty. Seeding initial road reports...")
      const severities = ["Low", "Medium", "High"]
      const statuses = ["Reported", "Verified", "Crew Dispatched", "Resolved"]
      const hazards = ["pothole", "surface water", "crack", "debris"]
      const hours = { Low: 168, Medium: 72, High: 24 }

      const initialReports = Array.from({ length: 60 }, (_, i) => {
        const severity = severities[(i * 7) % 3]
        const age = (i * 11) % 90
        const reportedAt = new Date(Date.now() - age * 3600000)
        const tagId = `RS-${2401 + i}`
        return {
          tagId,
          lat: 18.5 + ((i * 13) % 22) / 1000,
          lng: 73.84 + ((i * 17) % 28) / 1000,
          severity,
          hazardType: hazards[i % 4],
          status: statuses[(i * 5) % 4],
          confidence: 72 + ((i * 7) % 27),
          district: ["Central", "East", "West"][i % 3],
          reportedAt: reportedAt.toISOString(),
          slaDeadline: new Date(
            reportedAt.getTime() + hours[severity] * 3600000,
          ).toISOString(),
          duplicates: 1 + ((i * 3) % 12),
          clusterId: `C-${Math.floor(i / 4) + 1}`,
          priority: 42 + ((i * 9) % 58),
          description: `Road maintenance report for ${hazards[i % 4]} in ${["Central", "East", "West"][i % 3]} district.`,
          photo:
            "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=70",
          photos: [
            "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=70",
          ],
        }
      })

      await RoadTag.insertMany(initialReports)
      console.log(
        `✅ Seeded ${initialReports.length} road reports into MongoDB!`,
      )
    }
  } catch (err) {
    console.error("Initial seed error:", err.message)
  }
}

// ==========================================
// MongoDB Connection
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✅ Connected to local MongoDB successfully at: ${MONGO_URI}`)
    seedInitialDataIfEmpty()
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message)
    console.log(
      "💡 Ensure MongoDB service or mongod is running on mongodb://localhost:27017",
    )
  })

// ==========================================
// API Routes
// ==========================================

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  })
})

// GET /api/road-tags - Retrieve all road tags from MongoDB
app.get("/api/road-tags", async (req, res) => {
  try {
    const { severity, status, district } = req.query
    const filter = {}

    if (severity && severity !== "All") filter.severity = severity
    if (status && status !== "All") filter.status = status
    if (district && district !== "All") filter.district = district

    const tags = await RoadTag.find(filter).sort({ createdAt: -1 })
    res.status(200).json(tags.map(formatTag))
  } catch (error) {
    console.error("Error fetching road tags:", error)
    res
      .status(500)
      .json({ error: "Failed to retrieve road tags", details: error.message })
  }
})

// Alias: GET /api/tags
app.get("/api/tags", async (req, res) => {
  try {
    const tags = await RoadTag.find().sort({ createdAt: -1 })
    res.status(200).json(tags.map(formatTag))
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve tags", details: error.message })
  }
})

// GET /api/road-tags/:id - Retrieve a single road tag by ID or tagId
app.get("/api/road-tags/:id", async (req, res) => {
  try {
    const { id } = req.params
    let tag = null
    if (mongoose.isValidObjectId(id)) {
      tag = await RoadTag.findById(id)
    }
    if (!tag) {
      tag = await RoadTag.findOne({ $or: [{ tagId: id }, { id: id }] })
    }
    if (!tag) {
      return res.status(404).json({ error: "Road tag not found" })
    }
    res.status(200).json(formatTag(tag))
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error fetching tag", details: error.message })
  }
})

// POST /api/road-tags - Create & store a new road tag with picture and details
app.post("/api/road-tags", async (req, res) => {
  try {
    const body = req.body || {}
    const lat = Number(body.lat)
    const lng = Number(body.lng)

    if (isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({ error: "Valid coordinates (lat, lng) are required." })
    }

    const tagId =
      body.tagId || body.id || `RS-${Math.floor(3000 + Math.random() * 6000)}`
    const photo = body.photo || (body.photos && body.photos[0]) || ""
    const photos =
      body.photos && body.photos.length > 0 ? body.photos : photo ? [photo] : []

    const newTag = new RoadTag({
      ...body,
      tagId,
      lat,
      lng,
      photo,
      photos,
      hazardType: body.hazardType || body.category || "pothole",
      severity: body.severity || "Medium",
      status: body.status || "Reported",
      district: body.district || "Central",
      description: body.description || "",
      confidence: body.confidence ?? 80,
      priority: body.priority ?? 50,
      duplicates: body.duplicates ?? 1,
      clusterId: body.clusterId || `C-${tagId}`,
      reportedAt: body.reportedAt || new Date().toISOString(),
      slaDeadline:
        body.slaDeadline || new Date(Date.now() + 72 * 3600000).toISOString(),
    })

    const savedTag = await newTag.save()
    console.log(
      `📌 Stored new road report in MongoDB: [${savedTag.tagId}] ${savedTag.hazardType} (${photos.length} photo(s))`,
    )
    res.status(201).json(formatTag(savedTag))
  } catch (error) {
    console.error("Error creating road tag:", error)
    res
      .status(400)
      .json({ error: "Failed to create road tag", details: error.message })
  }
})

// Alias: POST /api/tags
app.post("/api/tags", async (req, res) => {
  try {
    const newTag = new RoadTag(req.body)
    const saved = await newTag.save()
    res.status(201).json(formatTag(saved))
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to create tag", details: error.message })
  }
})

// PATCH /api/road-tags/:id - Update road tag (status, severity, notes, resolution)
app.patch("/api/road-tags/:id", async (req, res) => {
  try {
    const { id } = req.params
    let query = {}
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { tagId: id }] }
    } else {
      query = { $or: [{ tagId: id }, { id: id }] }
    }

    let updatedTag = await RoadTag.findOneAndUpdate(query, { $set: req.body }, {
      new: true,
      runValidators: false,
    })

    // If tag was not in DB yet (e.g. updating an initial mock item), create it in DB!
    if (!updatedTag) {
      const newTag = new RoadTag({
        ...req.body,
        tagId: id,
        status: req.body.status || "Reported",
        lat: req.body.lat || 18.51,
        lng: req.body.lng || 73.85,
        hazardType: req.body.hazardType || "pothole",
      })
      updatedTag = await newTag.save()
      console.log(`📌 Persisted first-time update for tag ${id} into MongoDB!`)
    } else {
      console.log(
        `🔄 Updated tag ${id} in MongoDB: status -> ${updatedTag.status}`,
      )
    }

    res.status(200).json(formatTag(updatedTag))
  } catch (error) {
    console.error("Error updating road tag:", error)
    res
      .status(400)
      .json({ error: "Failed to update road tag", details: error.message })
  }
})

// PUT /api/road-tags/:id - Update or replace road tag in MongoDB
app.put("/api/road-tags/:id", async (req, res) => {
  try {
    const { id } = req.params
    let query = {}
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { tagId: id }] }
    } else {
      query = { $or: [{ tagId: id }, { id: id }] }
    }

    const updatedTag = await RoadTag.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, upsert: true, runValidators: false },
    )
    console.log(`📌 PUT updated road tag ${id} in MongoDB!`)
    res.status(200).json(formatTag(updatedTag))
  } catch (error) {
    console.error("Error in PUT road tag:", error)
    res
      .status(400)
      .json({ error: "Failed to update road tag", details: error.message })
  }
})

// Alias: PUT /api/tags/:id
app.put("/api/tags/:id", async (req, res) => {
  try {
    const { id } = req.params
    let query = {}
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { tagId: id }] }
    } else {
      query = { $or: [{ tagId: id }, { id: id }] }
    }

    const updatedTag = await RoadTag.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, upsert: true, runValidators: false },
    )
    res.status(200).json(formatTag(updatedTag))
  } catch (error) {
    res
      .status(400)
      .json({ error: "Failed to update tag", details: error.message })
  }
})

// DELETE /api/road-tags/:id - Delete a road tag
app.delete("/api/road-tags/:id", async (req, res) => {
  try {
    const { id } = req.params
    let query = {}
    if (mongoose.isValidObjectId(id)) {
      query = { $or: [{ _id: id }, { tagId: id }] }
    } else {
      query = { $or: [{ tagId: id }, { id: id }] }
    }

    const deletedTag = await RoadTag.findOneAndDelete(query)
    if (!deletedTag) {
      return res.status(404).json({ error: "Road tag not found" })
    }
    res.status(200).json({ message: "Road tag deleted successfully", id })
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete road tag", details: error.message })
  }
})

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 RoadSense Backend Server running on http://localhost:${PORT}`)
  console.log(`📡 Endpoints:`)
  console.log(`   - GET    /api/health`)
  console.log(`   - GET    /api/road-tags`)
  console.log(`   - POST   /api/road-tags (saves photos + details to MongoDB)`)
  console.log(`   - PATCH  /api/road-tags/:id (persists updates to MongoDB)`)
})
