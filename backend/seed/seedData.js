import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Complaint, { Counter } from '../models/Complaint.js';
import { connectDB } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const INITIAL_COMPLAINT_SEEDS = [
  {
    complaintId: "RG-2026-08491",
    title: "Deep crater near Outer Ring Road flyover descent",
    description: "Deep pothole spanning almost entire left lane right after the flyover ramp. Vehicles swerve dangerously into the fast lane at 60 km/h. High two-wheeler skid hazard.",
    address: "Outer Ring Road, Pillar 142B, North Corridor",
    roadName: "Outer Ring Road",
    latitude: 12.9815,
    longitude: 77.6402,
    zone: "North Zone",
    ward: "Ward 18 - Marathahalli Sector",
    priorityLabel: "critical",
    priorityScore: 92,
    status: "in_progress",
    severity: "high",
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
      detectedTags: ["Deep Cavity", "Loose Gravel", "Edge Deterioration", "High Traffic Hazard"],
    },
    assignedEngineer: {
      name: "PWD Rapid Response Unit #4",
      supervisor: "Ramesh Kumar (Junior Engineer)",
      contact: "+91 80-2299-4401",
      targetCompletion: "Within 24 Hours",
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-25T08:45:00Z"),
        note: "Citizen report registered with geo-coordinates and initial photo.",
        actor: "Citizen Portal",
      },
      {
        status: "verified",
        timestamp: new Date("2026-10-25T08:46:00Z"),
        note: "Automated damage analysis: 9.2cm cavity, 96.8% confidence. Classified as Critical Priority.",
        actor: "RoadGuard AI Engine",
      },
      {
        status: "assigned",
        timestamp: new Date("2026-10-25T11:30:00Z"),
        note: "Engineering audit verified. Work Order #WO-8820 generated.",
        actor: "North Zone PWD Office",
      },
      {
        status: "in_progress",
        timestamp: new Date("2026-10-26T09:15:00Z"),
        note: "Rapid Response Unit #4 deployed with mobile asphalt mixing unit.",
        actor: "Field Operations Command",
      },
    ],
  },
  {
    complaintId: "RG-2026-08488",
    title: "Multiple surface ruptures outside City General Hospital",
    description: "Ambulance bay entrance has two interconnected potholes causing extreme shaking for patient transport vehicles.",
    address: "Hospital Road, Opp. Emergency Gate 2",
    roadName: "Hospital Road",
    latitude: 12.9732,
    longitude: 77.5891,
    zone: "Central Zone",
    ward: "Ward 04 - Civics Central",
    priorityLabel: "critical",
    priorityScore: 95,
    status: "assigned",
    severity: "high",
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
      detectedTags: ["Emergency Corridor", "Multi-Pothole Cluster", "Water Infiltration Risk"],
    },
    assignedEngineer: {
      name: "Emergency Road Repair Squad A",
      supervisor: "M. N. Varma",
      contact: "+91 80-2299-1102",
      targetCompletion: "Within 12 Hours",
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-26T07:15:00Z"),
        note: "Citizen report logged with hospital proximity flag.",
        actor: "Citizen Portal",
      },
      {
        status: "verified",
        timestamp: new Date("2026-10-26T07:16:00Z"),
        note: "High priority flag triggered due to <50m proximity to emergency room access.",
        actor: "RoadGuard AI Engine",
      },
      {
        status: "assigned",
        timestamp: new Date("2026-10-26T09:30:00Z"),
        note: "Emergency Squad A assigned for immediate evening patching shift.",
        actor: "Central Traffic & PWD Desk",
      },
    ],
  },
  {
    complaintId: "RG-2026-08475",
    title: "Large depression after water pipeline repair",
    description: "Road was dug up for water pipe repair last week and backfilled improperly. Sinking soil created an uneven 6-inch drop.",
    address: "14th Cross, 5th Main, Indiranagar",
    roadName: "14th Cross",
    latitude: 12.9784,
    longitude: 77.6408,
    zone: "East Zone",
    ward: "Ward 12 - Indiranagar East",
    priorityLabel: "high",
    priorityScore: 78,
    status: "submitted",
    severity: "medium",
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
      detectedTags: ["Utility Cut Settlement", "Transverse Depression"],
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-26T14:40:00Z"),
        note: "Citizen report logged with water utility cross-reference.",
        actor: "Citizen Portal",
      },
      {
        status: "submitted",
        timestamp: new Date("2026-10-26T14:41:00Z"),
        note: "Identified trench-line subsidence pattern. Assigned High Priority.",
        actor: "RoadGuard AI Engine",
      },
    ],
  },
  {
    complaintId: "RG-2026-08450",
    title: "Surface wear and alligator cracking near Metro Station Gate 3",
    description: "Heavy bus movement caused cracked bitumen and shallow pothole cluster. Water accumulates during rains.",
    address: "Metro Station Gate 3, South Boulevard",
    roadName: "South Boulevard",
    latitude: 12.9352,
    longitude: 77.6145,
    zone: "South Zone",
    ward: "Ward 22 - Jayanagar South",
    priorityLabel: "medium",
    priorityScore: 64,
    status: "resolved",
    severity: "medium",
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
      detectedTags: ["Fatigue Cracking", "Surface Spalling"],
    },
    assignedEngineer: {
      name: "South Zone Mobile Patcher #2",
      supervisor: "S. K. Joshi",
      contact: "+91 80-2299-6611",
      targetCompletion: "Completed",
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-20T10:10:00Z"),
        note: "Citizen report logged with photo.",
        actor: "Citizen Portal",
      },
      {
        status: "verified",
        timestamp: new Date("2026-10-20T10:11:00Z"),
        note: "Classified as Moderate wear, Medium priority.",
        actor: "RoadGuard AI Engine",
      },
      {
        status: "assigned",
        timestamp: new Date("2026-10-22T09:00:00Z"),
        note: "Unit deployed for micro-surfacing and mastic asphalt patching.",
        actor: "South PWD Wing",
      },
      {
        status: "resolved",
        timestamp: new Date("2026-10-23T16:30:00Z"),
        note: "Repair finished. Post-repair inspection passed AI quality check.",
        actor: "Ward 22 Inspection Wing",
      },
    ],
  },
  {
    complaintId: "RG-2026-08432",
    title: "Small shoulder erosion on School Zone Road",
    description: "Edge breakdown along curb near St. Mary's School entrance. Causes bicycles to lose balance when buses pass.",
    address: "St. Mary's Road, Corner of 3rd Avenue",
    roadName: "St. Mary's Road",
    latitude: 12.9644,
    longitude: 77.6012,
    zone: "Central Zone",
    ward: "Ward 08 - Richmond Town",
    priorityLabel: "low",
    priorityScore: 45,
    status: "verified",
    severity: "low",
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
      detectedTags: ["Edge Erosion", "Low Depth", "Pedestrian Border"],
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-26T11:20:00Z"),
        note: "Report received via citizen mobile web interface.",
        actor: "Citizen Portal",
      },
      {
        status: "verified",
        timestamp: new Date("2026-10-26T15:00:00Z"),
        note: "Approved for regular weekly batch maintenance run.",
        actor: "Central Zone PWD",
      },
    ],
  },
  {
    complaintId: "RG-2026-08419",
    title: "Severe trench cave-in following monsoon downpour",
    description: "Asphalt collapsed over an old storm water drain pipe. Hole is over 10 inches deep with exposed rebar and stones.",
    address: "Ring Road Service Road, Opp. Tech Park Gate 1",
    roadName: "Ring Road Service Road",
    latitude: 12.9228,
    longitude: 77.6844,
    zone: "East Zone",
    ward: "Ward 19 - Bellandur Sub-division",
    priorityLabel: "critical",
    priorityScore: 98,
    status: "resolved",
    severity: "high",
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
      detectedTags: ["Severe Cave-in", "Subgrade Failure", "Immediate Crash Hazard"],
    },
    assignedEngineer: {
      name: "Emergency Heavy Infrastructure Wing",
      supervisor: "K. R. Murthy",
      contact: "+91 80-2299-8833",
      targetCompletion: "Completed",
    },
    statusHistory: [
      {
        status: "submitted",
        timestamp: new Date("2026-10-18T09:30:00Z"),
        note: "Emergency citizen report logged.",
        actor: "Citizen Portal",
      },
      {
        status: "verified",
        timestamp: new Date("2026-10-18T09:31:00Z"),
        note: "Auto-escalated to Critical (Score: 98). SMS alert dispatched to On-Call Chief Engineer.",
        actor: "RoadGuard AI Engine",
      },
      {
        status: "assigned",
        timestamp: new Date("2026-10-18T10:45:00Z"),
        note: "Traffic police placed safety cones; heavy roller crew started excavation & sub-base relaying.",
        actor: "Traffic Police & PWD",
      },
      {
        status: "resolved",
        timestamp: new Date("2026-10-19T23:00:00Z"),
        note: "Concrete base cured and bituminous top coat finished with anti-skid texture.",
        actor: "Heavy Infrastructure Wing",
      },
    ],
  },
];

/**
 * Auto-seed sample complaints if collection is currently empty
 */
export async function autoSeedIfEmpty() {
  try {
    const count = await Complaint.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database is empty. Seeding initial prototype complaints...');
      await Complaint.insertMany(INITIAL_COMPLAINT_SEEDS);

      // Initialize counter to 8500 so next auto-generated IDs are RG-2026-08501, etc.
      const currentYear = new Date().getFullYear();
      await Counter.findByIdAndUpdate(
        `complaints_${currentYear}`,
        { seq: 8500 },
        { upsert: true }
      );

      console.log(`[Seed] Seeded ${INITIAL_COMPLAINT_SEEDS.length} sample complaints successfully.`);
    }
  } catch (err) {
    console.error('[Seed] Auto-seed failed:', err.message);
  }
}

// Standalone script execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectDB()
    .then(async () => {
      console.log('[Seed] Clearing existing complaints and counters...');
      await Complaint.deleteMany({});
      await Counter.deleteMany({});
      await Complaint.insertMany(INITIAL_COMPLAINT_SEEDS);

      const currentYear = new Date().getFullYear();
      await Counter.findByIdAndUpdate(
        `complaints_${currentYear}`,
        { seq: 8500 },
        { upsert: true }
      );

      console.log(`[Seed] Seeded ${INITIAL_COMPLAINT_SEEDS.length} complaints.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}
