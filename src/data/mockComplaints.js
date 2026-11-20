export const INITIAL_COMPLAINTS = [
  {
    id: "RG-2026-8491",
    title: "Deep crater near Outer Ring Road flyover descent",
    description: "Deep pothole spanning almost entire left lane right after the flyover ramp. Vehicles swerve dangerously into the fast lane at 60 km/h. High two-wheeler skid hazard.",
    location: "Outer Ring Road, Pillar 142B, North Corridor",
    coordinates: { lat: 12.9815, lng: 77.6402 },
    zone: "North Zone",
    ward: "Ward 18 - Marathahalli Sector",
    priority: "Critical",
    status: "In Progress",
    severity: "Severe",
    reportedAt: "2026-10-25 08:45 AM",
    reporterName: "Dr. Arvind Swamy",
    reporterContact: "+91 98450-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 96.8,
      estimatedArea: "0.78 sq. m",
      estimatedDepth: "9.2 cm",
      surfaceType: "Bituminous Asphalt",
      roadType: "Arterial Highway",
      hazardScore: 92,
      duplicateCheck: "Passed (No duplicates within 25m)",
      detectedTags: ["Deep Cavity", "Loose Gravel", "Edge Deterioration", "High Traffic Hazard"]
    },
    assignedCrew: {
      name: "PWD Rapid Response Unit #4",
      supervisor: "Ramesh Kumar (Junior Engineer)",
      contact: "+91 80-2299-4401",
      targetCompletion: "2026-10-28 06:00 PM"
    },
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-25 08:45 AM",
        description: "Citizen report registered with geo-coordinates and initial photo.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Vision & Duplicate Check",
        timestamp: "2026-10-25 08:46 AM",
        description: "Automated damage analysis: 9.2cm cavity, 96.8% confidence. Classified as Critical Priority.",
        actor: "RoadGuard AI Engine (v2.4)",
        status: "completed"
      },
      {
        step: "Ward Engineer Work Order",
        timestamp: "2026-10-25 11:30 AM",
        description: "Engineering audit verified. Work Order #WO-8820 generated.",
        actor: "North Zone PWD Office",
        status: "completed"
      },
      {
        step: "Crew Dispatched",
        timestamp: "2026-10-26 09:15 AM",
        description: "Rapid Response Unit #4 deployed with mobile asphalt mixing unit.",
        actor: "Field Operations Command",
        status: "in-progress"
      },
      {
        step: "Repair & Quality Audit",
        timestamp: "Pending",
        description: "Cold-mix / hot-mix filling, roller compaction, and post-repair audit photo.",
        actor: "Quality Assurance Inspector",
        status: "upcoming"
      }
    ]
  },
  {
    id: "RG-2026-8488",
    title: "Multiple surface ruptures outside City General Hospital",
    description: "Ambulance bay entrance has two interconnected potholes causing extreme shaking for patient transport vehicles.",
    location: "Hospital Road, Opp. Emergency Gate 2",
    coordinates: { lat: 12.9732, lng: 77.5891 },
    zone: "Central Zone",
    ward: "Ward 04 - Civics Central",
    priority: "Critical",
    status: "Crew Assigned",
    severity: "Severe",
    reportedAt: "2026-10-26 07:15 AM",
    reporterName: "Priya Sundaram",
    reporterContact: "+91 97312-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 94.5,
      estimatedArea: "1.10 sq. m",
      estimatedDepth: "8.0 cm",
      surfaceType: "Dense Bitumen Macadam",
      roadType: "Hospital Critical Route",
      hazardScore: 95,
      duplicateCheck: "Passed (1 verified report clustered)",
      detectedTags: ["Emergency Corridor", "Multi-Pothole Cluster", "Water Infiltration Risk"]
    },
    assignedCrew: {
      name: "Emergency Road Repair Squad A",
      supervisor: "M. N. Varma",
      contact: "+91 80-2299-1102",
      targetCompletion: "2026-10-27 11:00 PM"
    },
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-26 07:15 AM",
        description: "Citizen report logged with hospital proximity flag.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Vision & Priority Scoring",
        timestamp: "2026-10-26 07:16 AM",
        description: "High priority flag triggered due to <50m proximity to emergency room access.",
        actor: "RoadGuard AI Engine",
        status: "completed"
      },
      {
        step: "Crew Assigned",
        timestamp: "2026-10-26 09:30 AM",
        description: "Emergency Squad A assigned for immediate evening patching shift.",
        actor: "Central Traffic & PWD Desk",
        status: "completed"
      },
      {
        step: "Repair Execution",
        timestamp: "Expected 2026-10-27",
        description: "Night work permit scheduled to avoid day-time ambulance blockage.",
        actor: "Squad A",
        status: "upcoming"
      }
    ]
  },
  {
    id: "RG-2026-8475",
    title: "Large depression after water pipeline repair",
    description: "Road was dug up for water pipe repair last week and backfilled improperly. Sinking soil created an uneven 6-inch drop.",
    location: "14th Cross, 5th Main, Indiranagar",
    coordinates: { lat: 12.9784, lng: 77.6408 },
    zone: "East Zone",
    ward: "Ward 12 - Indiranagar East",
    priority: "High",
    status: "Pending Verification",
    severity: "Moderate",
    reportedAt: "2026-10-26 02:40 PM",
    reporterName: "Rajeev Nambiar",
    reporterContact: "+91 94480-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 91.2,
      estimatedArea: "1.45 sq. m",
      estimatedDepth: "7.1 cm",
      surfaceType: "Trench Settlement / Asphalt",
      roadType: "Residential Sub-Arterial",
      hazardScore: 78,
      duplicateCheck: "Passed (First report in grid)",
      detectedTags: ["Utility Cut Settlement", "Transverse Depression"]
    },
    assignedCrew: null,
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-26 02:40 PM",
        description: "Citizen report logged with water utility cross-reference.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Vision Analysis",
        timestamp: "2026-10-26 02:41 PM",
        description: "Identified trench-line subsidence pattern. Assigned High Priority.",
        actor: "RoadGuard AI Engine",
        status: "completed"
      },
      {
        step: "Ward Verification",
        timestamp: "In Queue",
        description: "Awaiting field confirmation from Ward 12 Assistant Engineer.",
        actor: "East Zone Office",
        status: "in-progress"
      }
    ]
  },
  {
    id: "RG-2026-8450",
    title: "Surface wear and alligator cracking near Metro Station Gate 3",
    description: "Heavy bus movement caused cracked bitumen and shallow pothole cluster. Water accumulates during rains.",
    location: "Metro Station Gate 3, South Boulevard",
    coordinates: { lat: 12.9352, lng: 77.6145 },
    zone: "South Zone",
    ward: "Ward 22 - Jayanagar South",
    priority: "Medium",
    status: "Resolved",
    severity: "Moderate",
    reportedAt: "2026-10-20 10:10 AM",
    reporterName: "Meenakshi Rao",
    reporterContact: "+91 98860-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1584463699042-4217158bc753?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 95.1,
      estimatedArea: "0.55 sq. m",
      estimatedDepth: "4.8 cm",
      surfaceType: "Bituminous Wear Course",
      roadType: "Transit Hub Link",
      hazardScore: 64,
      duplicateCheck: "Passed",
      detectedTags: ["Fatigue Cracking", "Surface Spalling"]
    },
    assignedCrew: {
      name: "South Zone Mobile Patcher #2",
      supervisor: "S. K. Joshi",
      contact: "+91 80-2299-6611",
      completedAt: "2026-10-23 04:30 PM"
    },
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-20 10:10 AM",
        description: "Citizen report logged with photo.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Verification",
        timestamp: "2026-10-20 10:11 AM",
        description: "Classified as Moderate wear, Medium priority.",
        actor: "RoadGuard AI Engine",
        status: "completed"
      },
      {
        step: "Crew Dispatched",
        timestamp: "2026-10-22 09:00 AM",
        description: "Unit deployed for micro-surfacing and mastic asphalt patching.",
        actor: "South PWD Wing",
        status: "completed"
      },
      {
        step: "Resolved & Inspected",
        timestamp: "2026-10-23 04:30 PM",
        description: "Repair finished. Post-repair inspection passed AI quality check.",
        actor: "Ward 22 Inspection Wing",
        status: "completed"
      }
    ]
  },
  {
    id: "RG-2026-8432",
    title: "Small shoulder erosion on School Zone Road",
    description: "Edge breakdown along curb near St. Mary's School entrance. Causes bicycles to lose balance when buses pass.",
    location: "St. Mary's Road, Corner of 3rd Avenue",
    coordinates: { lat: 12.9644, lng: 77.6012 },
    zone: "Central Zone",
    ward: "Ward 08 - Richmond Town",
    priority: "Low",
    status: "Verified",
    severity: "Minor",
    reportedAt: "2026-10-26 11:20 AM",
    reporterName: "Anil Deshmukh",
    reporterContact: "+91 94490-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 89.4,
      estimatedArea: "0.32 sq. m",
      estimatedDepth: "3.2 cm",
      surfaceType: "Pavement Shoulder",
      roadType: "School Zone Local",
      hazardScore: 45,
      duplicateCheck: "Passed",
      detectedTags: ["Edge Erosion", "Low Depth", "Pedestrian Border"]
    },
    assignedCrew: null,
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-26 11:20 AM",
        description: "Report received via citizen mobile web interface.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Severity Scoring",
        timestamp: "2026-10-26 11:21 AM",
        description: "Assigned Low severity based on shallow depth. Tagged for scheduled routine patching.",
        actor: "RoadGuard AI Engine",
        status: "completed"
      },
      {
        step: "Verified by Field Supervisor",
        timestamp: "2026-10-26 03:00 PM",
        description: "Approved for regular weekly batch maintenance run.",
        actor: "Central Zone PWD",
        status: "completed"
      }
    ]
  },
  {
    id: "RG-2026-8419",
    title: "Severe trench cave-in following monsoon downpour",
    description: "Asphalt collapsed over an old storm water drain pipe. Hole is over 10 inches deep with exposed rebar and stones.",
    location: "Ring Road Service Road, Opp. Tech Park Gate 1",
    coordinates: { lat: 12.9228, lng: 77.6844 },
    zone: "East Zone",
    ward: "Ward 19 - Bellandur Sub-division",
    priority: "Critical",
    status: "Resolved",
    severity: "Severe",
    reportedAt: "2026-10-18 09:30 AM",
    reporterName: "Siddharth Jain",
    reporterContact: "+91 99000-XXXXX",
    imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    aiAnalysis: {
      confidence: 97.9,
      estimatedArea: "1.80 sq. m",
      estimatedDepth: "12.5 cm",
      surfaceType: "Reinforced Asphalt Subgrade",
      roadType: "High Density Corridor",
      hazardScore: 98,
      duplicateCheck: "Passed (4 citizens reported in 1 hour)",
      detectedTags: ["Severe Cave-in", "Subgrade Failure", "Immediate Crash Hazard"]
    },
    assignedCrew: {
      name: "Emergency Heavy Infrastructure Wing",
      supervisor: "K. R. Murthy",
      contact: "+91 80-2299-8833",
      completedAt: "2026-10-19 11:00 PM"
    },
    timeline: [
      {
        step: "Complaint Logged",
        timestamp: "2026-10-18 09:30 AM",
        description: "Emergency citizen report logged.",
        actor: "Citizen Portal",
        status: "completed"
      },
      {
        step: "AI Auto-Escalation",
        timestamp: "2026-10-18 09:31 AM",
        description: "Auto-escalated to Critical (Score: 98). SMS alert dispatched to On-Call Chief Engineer.",
        actor: "RoadGuard AI Engine",
        status: "completed"
      },
      {
        step: "Traffic Barricaded & Crew Deployed",
        timestamp: "2026-10-18 10:45 AM",
        description: "Traffic police placed safety cones; heavy roller crew started excavation & sub-base relaying.",
        actor: "Traffic Police & PWD",
        status: "completed"
      },
      {
        step: "Permanent Restoration Completed",
        timestamp: "2026-10-19 11:00 PM",
        description: "Concrete base cured and bituminous top coat finished with anti-skid texture.",
        actor: "Heavy Infrastructure Wing",
        status: "completed"
      }
    ]
  }
];

export const MUNICIPAL_ZONES = [
  "All Zones",
  "North Zone",
  "Central Zone",
  "South Zone",
  "East Zone"
];

export const MUNICIPAL_CREWS = [
  { id: "crew-1", name: "PWD Rapid Response Unit #4", zone: "North Zone", lead: "Ramesh Kumar" },
  { id: "crew-2", name: "Emergency Road Repair Squad A", zone: "Central Zone", lead: "M. N. Varma" },
  { id: "crew-3", name: "South Zone Mobile Patcher #2", zone: "South Zone", lead: "S. K. Joshi" },
  { id: "crew-4", name: "East Asphalt Patch Division #1", zone: "East Zone", lead: "Harish Gowda" },
  { id: "crew-5", name: "Civic Fast Action Flying Squad", zone: "City-wide", lead: "Anand Verma" }
];

export const SAMPLE_REPORT_PRESETS = [
  {
    name: "MG Road near Metro Pillar 112",
    location: "MG Road, Opposite Metro Pillar 112, Central Zone",
    description: "Deep pothole on the right side of the carriageway. Water collected inside making it invisible at dusk.",
    coordinates: { lat: 12.9752, lng: 77.6074 },
    zone: "Central Zone",
    previewImage: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Outer Ring Road Tech Corridor",
    location: "Outer Ring Road, Near Bellandur Flyover Service Lane",
    description: "Large asphalt rupture spanning width of two-wheeler bike lane. Multiple commuters spotted almost skidding.",
    coordinates: { lat: 12.9260, lng: 77.6762 },
    zone: "East Zone",
    previewImage: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Residential Market Road, Sector 7",
    location: "Sector 7 Main Road, Beside Fresh Mart Supermarket",
    description: "Depression left after underground optical fiber trenching work. Causes traffic slowdown during peak hours.",
    coordinates: { lat: 12.9121, lng: 77.6446 },
    zone: "South Zone",
    previewImage: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80"
  }
];
