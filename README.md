# RoadGuard AI 🛡️
### Intelligent Pothole Detection & Smart Road Maintenance System

A civic technology frontend prototype built for municipal road damage reporting, automated hazard triage, and public works maintenance automation.

---

## 🚀 Key Features Implemented

### 1. 🏛️ Smart-City Landing Page (`/`)
- Real civic technology aesthetic with navy text, white/slate background, and emerald green accents.
- Problem statement detailing commuter safety hazards, vehicle damage, and municipal triage backlogs.
- Navigation and Call-to-Actions for:
  - **Report a Pothole**
  - **Track Complaint**
  - **Admin Command Desk**
- Civic impact KPI ticker (Active Grievances, 94.2% AI Precision, 36h Average SLA, 100% Geo-Verified).
- Feature cards explaining:
  - **AI Computer Vision Detection** (Cavity surface area and depth scoring)
  - **Geospatial Duplicate Detection** (15-meter radius clustering to prevent work-order duplication)
  - **Dynamic Priority Scoring** (Proximity to hospitals, school zones, and arterial density)
  - **Repair Verification & Audit** (Post-patch inspection photo verification before ticket closure)
- 4-Stage Municipal Workflow lifecycle.
- Live grievance ticker preview.

### 2. 👥 Citizen Grievance Portal (`/citizen`)
- 4 Key Summary Metrics: Total Reports, Pending Verification, Repairs in Progress, Resolved Complaints.
- Filterable grievance list with live search and status tabs.
- Priority and Status badges with clear municipal color coding.
- Road safety reminder for citizens taking photos in traffic.
- Direct link to launch report or track live status.

### 3. 📸 Report Pothole Page (`/report`)
- Photo upload with local image preview and clear button.
- **Prototype Quick Presets**: Test instant reporting with 1 click without needing local pothole images.
- **Simulated AI Surface Analysis (Demo)**:
  - Demonstrates future integration with YOLOv8 & depth estimation models.
  - Computes AI Confidence, Cavity Area, Estimated Depth, and Hazard Severity.
  - Clearly labeled as a simulated academic feature.
- **Browser GPS Integration**:
  - Direct integration with HTML5 `navigator.geolocation`.
  - Captures latitude and longitude.
  - **Graceful Error Handling**: Displays a clear alert if GPS permission is denied or unavailable, allowing manual address input.
- Instant Complaint ID generation (`RG-2026-XXXX`).
- Success modal with instant transition to tracking.

### 4. 🔍 Track Complaint Page (`/track`)
- Search by Complaint ID (`RG-2026-XXXX`) with URL query parameter support (`/track?id=...`).
- Quick-pick sample chips for testing without typing.
- Comprehensive complaint dossier:
  - Photo preview with AI scan diagnostics
  - Exact coordinates, ward division, and municipal zone
  - Assigned repair squad and target SLA
- **Interactive Vertical Progress Timeline**:
  - Stage 1: Complaint Logged
  - Stage 2: AI Vision & Deduplication
  - Stage 3: Ward Engineer Work Order
  - Stage 4: Crew Dispatched
  - Stage 5: Repair Execution & Audit Sign-off

### 5. 🛠️ Admin Command Desk (`/admin`)
- Operations statistics: Total Reports, Critical Hazards, Pending Triage, Active Repairs, Resolution Rate.
- Comprehensive table with real-time filters:
  - **Status Filter**: Pending Verification, Verified, Crew Assigned, In Progress, Resolved
  - **Priority Filter**: Critical, High, Medium, Low
  - **Severity Filter**: Severe, Moderate, Minor
  - **Zone Filter**: Central, North, South, East Zones
- Interactive Modal Actions:
  - **View Dossier**: Inspect full photo evidence, AI diagnostics, and timeline.
  - **Assign Crew**: Select from real municipal repair units (e.g., *PWD Rapid Response Unit #4*) with custom SLA windows.
  - **Update Status**: Advance complaints through municipal stages with inspector notes.
- Changes made in the Admin Desk immediately reflect reactively in Citizen Dashboard and Track Complaint views!
- **Reset Sample Data** button to quickly restore baseline testing state.

---

## 💻 Tech Stack
- **Framework**: React 18
- **Tooling**: Vite 6
- **Styling**: Tailwind CSS 3 (Custom navy & civic green palette)
- **Icons**: Lucide React
- **Routing**: React Router DOM 6
- **State & Persistence**: React Context API + LocalStorage

---

## 🏃‍♂️ How to Run the Application

1. Make sure you are in the project root directory:
   ```bash
   cd "c:\Users\Mokshata\OneDrive\Desktop\RoadGuard AI"
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   *(or the port indicated in the terminal output)*

4. To test a production build:
   ```bash
   npm run build
   npm run preview
   ```
