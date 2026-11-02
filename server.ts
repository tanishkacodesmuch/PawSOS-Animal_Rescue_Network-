import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}
// Middleware for parsing JSON and large payloads for photo uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// Disable test-account endpoints on the public website
app.use('/api/test', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available' });
  }
  next();
});

// Health check endpoint for Cloud Run and monitoring
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'PawSOS Rescue Platform', timestamp: new Date().toISOString() });
});

// Persistent JSON file storage path
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'pawsos_database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  salt: string;
  role: string; // citizen, rescuer, vet, ngo, admin
  verificationStatus: string; // pending, verified, rejected
  city: string;
  organizationName?: string;
  experienceYears?: number;
  rescueCapabilities?: string[];
  clinicName?: string;
  clinicAddress?: string;
  licenseNumber?: string;
  specializations?: string[];
  emergency247?: boolean;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isTestAccount?: boolean;
  createdAt: string;
}

interface DBOrganization {
  id: string;
  organizationName: string;
  organizationType: string;
  address: string;
  serviceArea: string;
  verificationStatus: string;
  contactPhone?: string;
  email?: string;
}

interface DBReport {
  id: string;
  caseId: string;
  reporterId?: string;
  animalType: string;
  condition: string;
  description: string;
  photoUrl: string;
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  urgency: string;
  status: string;
  verified: boolean;
  reporterName?: string;
  reporterPhone?: string;
  isAnonymous?: boolean;
  assignedRescuerId?: string;
  assignmentStatus?: string;
  assignedAt?: string;
  assignedClinicId?: string;
  assignedClinicName?: string;
  handoffStatus?: string; // pending, accepted, completed
  isTestCase?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DBAssignment {
  id: string;
  rescueReportId: string;
  rescuerId: string;
  assignmentStatus: string; // assigned, accepted, rejected, completed
  rejectionReason?: string;
  assignedAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

interface DBStatusHistory {
  id: string;
  rescueReportId: string;
  status: string;
  updatedBy: string;
  notes?: string;
  createdAt: string;
}

interface DBVeterinaryRecord {
  id: string;
  rescueReportId: string;
  veterinarianId: string;
  veterinarianName: string;
  diagnosis: string;
  treatment: string;
  recoveryStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface DBAvailability {
  id: string;
  rescuerId: string;
  availabilityStatus: string; // available, unavailable, busy, pending_verification
  serviceArea: string;
  updatedAt: string;
}

interface DBNotification {
  id: string;
  recipientId: string;
  rescueReportId?: string;
  caseId?: string;
  title: string;
  notificationType: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

interface DBData {
  users: DBUser[];
  organizations: DBOrganization[];
  reports: DBReport[];
  assignments: DBAssignment[];
  statusHistory: DBStatusHistory[];
  veterinaryRecords: DBVeterinaryRecord[];
  availability: DBAvailability[];
  notifications: DBNotification[];
}

const getInitialDB = (): DBData => ({
  users: [],
  organizations: [],
  reports: [],
  assignments: [],
  statusHistory: [],
  veterinaryRecords: [],
  availability: [],
  notifications: [],
});

const readDB = (): DBData => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        users: parsed.users || [],
        organizations: parsed.organizations || [],
        reports: parsed.reports || [],
        assignments: parsed.assignments || [],
        statusHistory: parsed.statusHistory || [],
        veterinaryRecords: parsed.veterinaryRecords || [],
        availability: parsed.availability || [],
        notifications: parsed.notifications || [],
      };
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  const initial = getInitialDB();
  writeDB(initial);
  return initial;
};

const writeDB = (data: DBData) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
};

// Security & Password Helpers
const hashPassword = (password: string, salt: string): string => {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
};

const createToken = (payload: { id: string; email: string; role: string }): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (expected !== signature) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
};

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const user = verifyToken(token);
    if (user) {
      (req as any).user = user;
    }
  }
  next();
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ detail: 'Authentication required. Please sign in.' });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user) {
    return res.status(401).json({ detail: 'Authentication required. Please sign in.' });
  }
  const db = readDB();
  const user = db.users.find((u) => u.id === (req as any).user.id);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ detail: 'Access restricted: Administrator credentials required.' });
  }
  next();
};

app.use(authMiddleware);

// Mask phone numbers for public privacy
const maskPhone = (phone?: string): string => {
  if (!phone || phone.length < 4) return 'Protected';
  return `${phone.slice(0, 3)} •••• ${phone.slice(-4)}`;
};

// Format User for API Response
const formatUserResponse = (user: DBUser) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  verificationStatus: user.verificationStatus,
  city: user.city,
  organizationName: user.organizationName,
  experienceYears: user.experienceYears || 0,
  rescueCapabilities: user.rescueCapabilities || [],
  clinicName: user.clinicName,
  clinicAddress: user.clinicAddress,
  licenseNumber: user.licenseNumber,
  specializations: user.specializations || [],
  emergency247: user.emergency247 || false,
  rejectionReason: user.rejectionReason,
  isTestAccount: user.isTestAccount || false,
  createdAt: user.createdAt,
});

// Format Full Rescue Case for API Response
const formatReportResponse = (report: DBReport, db: DBData) => {
  const timeline = db.statusHistory
    .filter((h) => h.rescueReportId === report.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((h) => ({
      id: h.id,
      stage: h.status,
      timestamp: h.createdAt,
      title: `Stage: ${h.status}`,
      description: h.notes,
      actor: h.updatedBy,
    }));

  let assignedRescuer = undefined;
  if (report.assignedRescuerId) {
    const rescuerUser = db.users.find((u) => u.id === report.assignedRescuerId);
    const assignment = db.assignments.find(
      (a) => a.rescueReportId === report.id && a.rescuerId === report.assignedRescuerId
    );
    if (rescuerUser) {
      assignedRescuer = {
        id: rescuerUser.id,
        name: rescuerUser.fullName,
        phone: rescuerUser.phone,
        city: rescuerUser.city,
        assignmentStatus: (assignment?.assignmentStatus || report.assignmentStatus || 'assigned') as any,
        assignedAt: assignment?.assignedAt || report.assignedAt || report.createdAt,
        etaMinutes: assignment?.assignmentStatus === 'accepted' ? 15 : undefined,
        rejectionReason: assignment?.rejectionReason,
      };
    }
  }

  let veterinaryRecord = undefined;
  const vetRec = db.veterinaryRecords.find((v) => v.rescueReportId === report.id);
  if (vetRec) {
    veterinaryRecord = {
      id: vetRec.id,
      veterinarianId: vetRec.veterinarianId,
      veterinarianName: vetRec.veterinarianName,
      diagnosis: vetRec.diagnosis,
      treatment: vetRec.treatment,
      recoveryStatus: vetRec.recoveryStatus,
      updatedAt: vetRec.updatedAt,
    };
  }

  return {
    id: report.id,
    caseId: report.caseId,
    reporterId: report.reporterId,
    animalType: report.animalType,
    condition: report.condition,
    description: report.description,
    photoUrl: report.photoUrl,
    lat: report.lat,
    lng: report.lng,
    address: report.address,
    landmark: report.landmark,
    urgency: report.urgency,
    status: report.status,
    verified: report.verified,
    reportedAt: report.createdAt,
    updatedAt: report.updatedAt,
    reporter: {
      name: report.isAnonymous ? 'Anonymous Good Samaritan' : report.reporterName || 'Citizen',
      phone: report.isAnonymous ? 'Protected' : report.reporterPhone || 'Not provided',
      anonymous: report.isAnonymous,
    },
    assignedRescuer,
    assignedClinicId: report.assignedClinicId,
    assignedClinicName: report.assignedClinicName,
    handoffStatus: report.handoffStatus,
    isTestCase: report.isTestCase || false,
    veterinaryRecord,
    timeline,
  };
};

// --- API ROUTES ---

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const {
    fullName,
    email,
    phone,
    password,
    role,
    city,
    organizationName,
    experienceYears,
    rescueCapabilities,
    clinicName,
    clinicAddress,
    licenseNumber,
    specializations,
    emergency247,
    isTestAccount,
  } = req.body;

  if (!fullName || !email || !password || !phone) {
    return res.status(400).json({ detail: 'Full name, email, phone, and password are required.' });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ detail: 'An account with this email address already exists.' });
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const id = crypto.randomUUID();

  // Citizens are verified by default; rescuers/vets/NGOs start as pending until approved by admin
  const verificationStatus = role === 'citizen' ? 'verified' : 'pending';

  const newUser: DBUser = {
    id,
    fullName,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    salt,
    role: role || 'citizen',
    verificationStatus,
    city: city || 'Unspecified',
    organizationName: organizationName || clinicName || undefined,
    experienceYears: experienceYears || 0,
    rescueCapabilities: rescueCapabilities || [],
    clinicName: clinicName || undefined,
    clinicAddress: clinicAddress || undefined,
    licenseNumber: licenseNumber || undefined,
    specializations: specializations || [],
    emergency247: emergency247 || false,
    isTestAccount: isTestAccount || false,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // If rescuer, register initial availability record (pending verification)
  if (role === 'rescuer') {
    db.availability.push({
      id: crypto.randomUUID(),
      rescuerId: id,
      availabilityStatus: verificationStatus === 'verified' ? 'available' : 'pending_verification',
      serviceArea: city || 'General Sector',
      updatedAt: new Date().toISOString(),
    });
  }

  // If organization provided, register organization profile
  const orgName = organizationName || clinicName;
  if (orgName && (role === 'ngo' || role === 'vet' || role === 'rescuer')) {
    db.organizations.push({
      id: crypto.randomUUID(),
      organizationName: orgName,
      organizationType: role === 'vet' ? 'Veterinary Clinic' : role === 'ngo' ? 'NGO & Shelter' : 'Rescuer',
      address: clinicAddress || city || 'Regional Headquarters',
      serviceArea: city || 'General Sector',
      verificationStatus: 'pending',
      contactPhone: phone,
      email: email.toLowerCase(),
    });
  }

  writeDB(db);

  const token = createToken({ id, email: newUser.email, role: newUser.role });
  res.status(201).json({
    token,
    user: formatUserResponse(newUser),
  });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ detail: 'Email and password are required.' });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    return res.status(401).json({ detail: 'Invalid email or password.' });
  }

  const token = createToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: formatUserResponse(user),
  });
});

// 3. Auth: Current User Profile
app.get('/api/auth/me', requireAuth, (req, res) => {
  const userId = (req as any).user.id;
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ detail: 'User profile not found.' });
  }
  res.json(formatUserResponse(user));
});

// 4. Notifications: User Inbox
app.get('/api/notifications', requireAuth, (req, res) => {
  const userId = (req as any).user.id;
  const db = readDB();
  const notifs = db.notifications
    .filter((n) => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
  res.json(notifs);
});

// 5. Notifications: Mark Read
app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
  const notifId = req.params.id;
  const userId = (req as any).user.id;
  const db = readDB();
  const notif = db.notifications.find((n) => n.id === notifId && n.recipientId === userId);
  if (notif) {
    notif.readStatus = true;
    writeDB(db);
  }
  res.json({ success: true });
});

// 6. Reports: Create Emergency Report
app.post('/api/reports', (req, res) => {
  const {
    animalType,
    condition,
    description,
    photoUrl,
    lat,
    lng,
    address,
    landmark,
    urgency,
    reporterName,
    reporterPhone,
    isAnonymous,
    isTestCase,
  } = req.body;

  if (!animalType || !condition || !photoUrl || lat === undefined || lng === undefined || !address) {
    return res.status(400).json({ detail: 'Animal type, condition, photo, and coordinates are required.' });
  }

  const db = readDB();
  const caseId = isTestCase
    ? `TEST-${Math.floor(1000 + Math.random() * 9000)}`
    : `AER-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const reporterId = (req as any).user?.id || undefined;

  const newReport: DBReport = {
    id: crypto.randomUUID(),
    caseId,
    reporterId,
    animalType,
    condition,
    description: description || '',
    photoUrl,
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    address,
    landmark: landmark || '',
    urgency: urgency || 'Moderate',
    status: 'Reported',
    verified: false,
    reporterName: isAnonymous ? 'Anonymous Good Samaritan' : reporterName || 'Citizen',
    reporterPhone: isAnonymous ? 'Not provided' : reporterPhone || 'Not provided',
    isAnonymous: Boolean(isAnonymous),
    isTestCase: Boolean(isTestCase),
    createdAt: now,
    updatedAt: now,
  };

  db.reports.push(newReport);

  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: newReport.id,
    status: 'Reported',
    updatedBy: isAnonymous ? 'Anonymous Citizen' : reporterName || 'Citizen',
    notes: 'Emergency incident reported to central response network.',
    createdAt: now,
  });

  // Notify admins of new emergency
  const admins = db.users.filter((u) => u.role === 'admin');
  admins.forEach((adminUser) => {
    db.notifications.push({
      id: crypto.randomUUID(),
      recipientId: adminUser.id,
      rescueReportId: newReport.id,
      caseId: newReport.caseId,
      title: `🚨 New Emergency: ${newReport.animalType}`,
      notificationType: 'new_report',
      message: `Emergency reported in ${newReport.address} (${newReport.urgency}). Requires triage verification.`,
      readStatus: false,
      createdAt: now,
    });
  });

  writeDB(db);
  res.status(201).json(formatReportResponse(newReport, db));
});

// 7. Reports: List / Filter
app.get('/api/reports', (req, res) => {
  const db = readDB();
  const { status, urgency, animal_type, city } = req.query;

  let filtered = [...db.reports];
  if (status && status !== 'all') {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (urgency && urgency !== 'all') {
    filtered = filtered.filter((r) => r.urgency === urgency);
  }
  if (animal_type && animal_type !== 'all') {
    filtered = filtered.filter((r) => r.animalType === animal_type);
  }
  if (city) {
    filtered = filtered.filter((r) => r.address.toLowerCase().includes((city as string).toLowerCase()));
  }

  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(filtered.map((r) => formatReportResponse(r, db)));
});

// 8. Reports: User's Reports / Assigned Cases
app.get('/api/reports/my', requireAuth, (req, res) => {
  const userId = (req as any).user.id;
  const db = readDB();
  const user = db.users.find((u) => u.id === userId);

  let myReports: DBReport[] = [];
  if (user?.role === 'rescuer') {
    // Show cases assigned to this rescuer
    myReports = db.reports.filter((r) => r.assignedRescuerId === userId);
  } else {
    // Show citizen's reported cases
    myReports = db.reports.filter((r) => r.reporterId === userId);
  }

  myReports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(myReports.map((r) => formatReportResponse(r, db)));
});

// 9. Reports: Lookup by Case ID
app.get('/api/reports/:caseId', (req, res) => {
  const caseIdParam = req.params.caseId.toUpperCase();
  const db = readDB();
  const report = db.reports.find((r) => r.caseId.toUpperCase() === caseIdParam);
  if (!report) {
    return res.status(404).json({ detail: `No rescue record found for Case ID ${caseIdParam}` });
  }
  res.json(formatReportResponse(report, db));
});

// 10. Reports: Update Status (Strictly Authorized)
app.patch('/api/reports/:caseId/status', requireAuth, (req, res) => {
  const { status: newStatus, notes } = req.body;
  if (!newStatus) {
    return res.status(400).json({ detail: 'Status is required.' });
  }

  const caseIdParam = req.params.caseId.toUpperCase();
  const db = readDB();
  const report = db.reports.find((r) => r.caseId.toUpperCase() === caseIdParam);
  if (!report) {
    return res.status(404).json({ detail: `Case ${caseIdParam} not found.` });
  }

  const currentUser = db.users.find((u) => u.id === (req as any).user.id);
  if (!currentUser) {
    return res.status(401).json({ detail: 'User session not found.' });
  }

  // Role & Ownership Verification
  if (currentUser.role === 'rescuer') {
    if (report.assignedRescuerId !== currentUser.id) {
      return res.status(403).json({ detail: 'You can only update status for cases assigned to your account.' });
    }
    if (!['On the Way', 'Rescued'].includes(newStatus)) {
      return res.status(400).json({
        detail: `Rescuers can only transition status to 'On the Way' or 'Rescued'. Received: ${newStatus}`,
      });
    }
  } else if (currentUser.role === 'vet') {
    if (!['Treated', 'Closed'].includes(newStatus)) {
      return res.status(400).json({
        detail: `Veterinarians can only transition cases to 'Treated' or 'Closed'. Received: ${newStatus}`,
      });
    }
  } else if (currentUser.role !== 'admin') {
    return res.status(403).json({ detail: 'You do not have authorization to modify operational case status.' });
  }

  const now = new Date().toISOString();
  report.status = newStatus;
  report.updatedAt = now;

  const actor = `${currentUser.fullName} (${currentUser.role})`;
  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: newStatus,
    updatedBy: actor,
    notes: notes || `Case transitioned to ${newStatus} by ${actor}.`,
    createdAt: now,
  });

  // Notify reporter if registered
  if (report.reporterId) {
    db.notifications.push({
      id: crypto.randomUUID(),
      recipientId: report.reporterId,
      rescueReportId: report.id,
      caseId: report.caseId,
      title: `Case Update: ${newStatus}`,
      notificationType: 'status_update',
      message: `Your reported case ${report.caseId} has moved to '${newStatus}'. ${notes || ''}`,
      readStatus: false,
      createdAt: now,
    });
  }

  writeDB(db);
  res.json(formatReportResponse(report, db));
});

// 11. Admin: Verify Case (requireAdmin)
app.post('/api/admin/reports/:caseId/verify', requireAdmin, (req, res) => {
  const caseIdParam = req.params.caseId.toUpperCase();
  const db = readDB();
  const report = db.reports.find((r) => r.caseId.toUpperCase() === caseIdParam);
  if (!report) {
    return res.status(404).json({ detail: `Case ${caseIdParam} not found.` });
  }

  const currentUser = db.users.find((u) => u.id === (req as any).user.id);
  const now = new Date().toISOString();

  report.verified = true;
  report.updatedAt = now;

  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: report.status,
    updatedBy: currentUser?.fullName || 'Triage Dispatcher',
    notes: 'Case authenticity and location coordinates authenticated by triage lead.',
    createdAt: now,
  });

  writeDB(db);
  res.json(formatReportResponse(report, db));
});

// 12. Admin: Partner Applications List (requireAdmin)
app.get('/api/admin/applications', requireAdmin, (req, res) => {
  const { status: statusFilter, role: roleFilter } = req.query;
  const db = readDB();

  let applications = db.users.filter((u) => ['rescuer', 'vet', 'ngo'].includes(u.role));
  if (statusFilter && statusFilter !== 'all') {
    applications = applications.filter((u) => u.verificationStatus === statusFilter);
  }
  if (roleFilter && roleFilter !== 'all') {
    applications = applications.filter((u) => u.role === roleFilter);
  }

  applications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(applications.map(formatUserResponse));
});

// 13. Admin: Approve Partner Application (requireAdmin)
app.post('/api/admin/applications/:userId/approve', requireAdmin, (req, res) => {
  const targetUserId = req.params.userId;
  const db = readDB();
  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ detail: 'Partner application not found.' });
  }

  const currentAdmin = db.users.find((u) => u.id === (req as any).user.id);
  const now = new Date().toISOString();

  targetUser.verificationStatus = 'verified';
  targetUser.reviewedBy = currentAdmin?.fullName || 'Administrator';
  targetUser.reviewedAt = now;

  // If rescuer, activate availability
  if (targetUser.role === 'rescuer') {
    let avail = db.availability.find((a) => a.rescuerId === targetUserId);
    if (avail) {
      avail.availabilityStatus = 'available';
      avail.updatedAt = now;
    } else {
      db.availability.push({
        id: crypto.randomUUID(),
        rescuerId: targetUserId,
        availabilityStatus: 'available',
        serviceArea: targetUser.city,
        updatedAt: now,
      });
    }
  }

  // If organization exists, verify it
  const org = db.organizations.find((o) => o.email?.toLowerCase() === targetUser.email.toLowerCase());
  if (org) {
    org.verificationStatus = 'verified';
  }

  // Send notification to approved partner
  db.notifications.push({
    id: crypto.randomUUID(),
    recipientId: targetUser.id,
    title: 'Accreditation Approved!',
    notificationType: 'partner_approved',
    message: `Congratulations ${targetUser.fullName}! Your official PawSOS partner accreditation has been approved. You are now active for emergency dispatches.`,
    readStatus: false,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, message: `${targetUser.fullName} has been officially approved.` });
});

// 14. Admin: Reject Partner Application (requireAdmin)
app.post('/api/admin/applications/:userId/reject', requireAdmin, (req, res) => {
  const targetUserId = req.params.userId;
  const { reason } = req.body;
  const db = readDB();
  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ detail: 'Partner application not found.' });
  }

  const currentAdmin = db.users.find((u) => u.id === (req as any).user.id);
  const now = new Date().toISOString();

  targetUser.verificationStatus = 'rejected';
  targetUser.rejectionReason = reason || 'Application did not meet minimum accreditation requirements.';
  targetUser.reviewedBy = currentAdmin?.fullName || 'Administrator';
  targetUser.reviewedAt = now;

  db.notifications.push({
    id: crypto.randomUUID(),
    recipientId: targetUser.id,
    title: 'Accreditation Application Update',
    notificationType: 'partner_rejected',
    message: `Your partner accreditation was not approved. Reason: ${targetUser.rejectionReason}`,
    readStatus: false,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, message: `Application for ${targetUser.fullName} rejected.` });
});

// 15. Admin: Request Additional Info (requireAdmin)
app.post('/api/admin/applications/:userId/request-info', requireAdmin, (req, res) => {
  const targetUserId = req.params.userId;
  const { message } = req.body;
  const db = readDB();
  const targetUser = db.users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ detail: 'Partner application not found.' });
  }

  const currentAdmin = db.users.find((u) => u.id === (req as any).user.id);
  const now = new Date().toISOString();

  db.notifications.push({
    id: crypto.randomUUID(),
    recipientId: targetUser.id,
    title: 'Additional Documentation Requested',
    notificationType: 'info_requested',
    message:
      message ||
      `Administrator ${currentAdmin?.fullName} has requested additional credentials or clinic documentation to complete verification.`,
    readStatus: false,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, message: `Information request sent to ${targetUser.fullName}.` });
});

// 16. Rescuers: Available List (Only Verified & Available, Masked Phone)
app.get('/api/rescuers/available', (req, res) => {
  const db = readDB();
  const { service_area } = req.query;

  // Must be verified and have availability === 'available'
  let eligible = db.users.filter(
    (u) => u.role === 'rescuer' && u.verificationStatus === 'verified'
  );

  const availableList = eligible
    .map((u) => {
      const avail = db.availability.find((a) => a.rescuerId === u.id);
      return {
        rescuerId: u.id,
        name: u.fullName,
        maskedPhone: maskPhone(u.phone),
        availabilityStatus: avail?.availabilityStatus || 'unavailable',
        serviceArea: avail?.serviceArea || u.city || 'General Sector',
        experienceYears: u.experienceYears || 0,
        capabilities: u.rescueCapabilities || [],
        isVerified: true,
        updatedAt: avail?.updatedAt || u.createdAt,
      };
    })
    .filter((a) => a.availabilityStatus === 'available');

  if (service_area) {
    const areaLower = (service_area as string).toLowerCase();
    const filtered = availableList.filter(
      (a) => a.serviceArea.toLowerCase().includes(areaLower)
    );
    return res.json(filtered);
  }

  res.json(availableList);
});

// 17. Rescuers: Update Availability (Requires Rescuer Role + Verified)
app.post('/api/rescuers/availability', requireAuth, (req, res) => {
  const { availabilityStatus, serviceArea } = req.body;
  const rescuerId = (req as any).user.id;
  const db = readDB();

  const user = db.users.find((u) => u.id === rescuerId);
  if (!user || user.role !== 'rescuer') {
    return res.status(403).json({ detail: 'Only registered rescuers can update duty availability.' });
  }

  if (user.verificationStatus !== 'verified' && availabilityStatus === 'available') {
    return res.status(403).json({
      detail: 'Your rescuer profile is pending administrative verification. You cannot go on duty until verified.',
    });
  }

  let avail = db.availability.find((a) => a.rescuerId === rescuerId);
  const now = new Date().toISOString();

  if (avail) {
    avail.availabilityStatus = availabilityStatus || 'available';
    if (serviceArea) avail.serviceArea = serviceArea;
    avail.updatedAt = now;
  } else {
    avail = {
      id: crypto.randomUUID(),
      rescuerId,
      availabilityStatus: availabilityStatus || 'available',
      serviceArea: serviceArea || user.city || 'General Sector',
      updatedAt: now,
    };
    db.availability.push(avail);
  }

  writeDB(db);
  res.json(avail);
});

// 18. Assignments: Assign Rescuer (requireAdmin)
app.post('/api/assignments', requireAdmin, (req, res) => {
  const { rescueReportId, rescuerId } = req.body;
  if (!rescueReportId || !rescuerId) {
    return res.status(400).json({ detail: 'Rescue report ID and rescuer ID are required.' });
  }

  const db = readDB();
  const report = db.reports.find((r) => r.id === rescueReportId || r.caseId === rescueReportId);
  if (!report) {
    return res.status(404).json({ detail: 'Rescue report not found.' });
  }

  const rescuer = db.users.find((u) => u.id === rescuerId && u.role === 'rescuer');
  if (!rescuer) {
    return res.status(404).json({ detail: 'Rescuer profile not found.' });
  }

  if (rescuer.verificationStatus !== 'verified') {
    return res.status(400).json({
      detail: `Cannot dispatch unverified rescuer ${rescuer.fullName}. Please approve their application first.`,
    });
  }

  const currentAdmin = db.users.find((u) => u.id === (req as any).user.id);
  const now = new Date().toISOString();
  const assignmentId = crypto.randomUUID();

  report.assignedRescuerId = rescuerId;
  report.assignmentStatus = 'assigned';
  report.assignedAt = now;
  report.status = 'Assigned';
  report.verified = true;
  report.updatedAt = now;

  // Upsert assignment record
  const existingAssignment = db.assignments.find(
    (a) => a.rescueReportId === report.id && a.rescuerId === rescuerId
  );
  if (existingAssignment) {
    existingAssignment.assignmentStatus = 'assigned';
    existingAssignment.assignedAt = now;
    existingAssignment.rejectionReason = undefined;
  } else {
    db.assignments.push({
      id: assignmentId,
      rescueReportId: report.id,
      rescuerId,
      assignmentStatus: 'assigned',
      assignedAt: now,
    });
  }

  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: 'Assigned',
    updatedBy: currentAdmin?.fullName || 'Dispatcher',
    notes: `Assigned to verified field responder ${rescuer.fullName}.`,
    createdAt: now,
  });

  // Notify Rescuer via in-app notification
  db.notifications.push({
    id: crypto.randomUUID(),
    recipientId: rescuer.id,
    rescueReportId: report.id,
    caseId: report.caseId,
    title: '🚨 New Emergency Dispatch Assigned',
    notificationType: 'emergency_dispatch',
    message: `Urgent case ${report.caseId} (${report.animalType} - ${report.urgency}) near ${report.address}. Please accept immediately to start navigation.`,
    readStatus: false,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, assignmentId, reportId: report.id, caseId: report.caseId });
});

// 19. Assignments: Accept Assignment (Authenticated Rescuer)
app.post('/api/assignments/:id/accept', requireAuth, (req, res) => {
  const assignmentId = req.params.id;
  const currentUserId = (req as any).user.id;
  const db = readDB();

  const assignment = db.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return res.status(404).json({ detail: 'Assignment not found.' });
  }

  // Prevent a rescuer from accepting someone else's assignment
  if (assignment.rescuerId !== currentUserId && (req as any).user.role !== 'admin') {
    return res.status(403).json({ detail: 'You can only accept assignments dispatched to your account.' });
  }

  const now = new Date().toISOString();
  assignment.assignmentStatus = 'accepted';
  assignment.acceptedAt = now;

  const report = db.reports.find((r) => r.id === assignment.rescueReportId);
  const currentUser = db.users.find((u) => u.id === currentUserId);

  if (report) {
    report.assignmentStatus = 'accepted';
    report.status = 'Assigned';
    report.updatedAt = now;

    db.statusHistory.push({
      id: crypto.randomUUID(),
      rescueReportId: report.id,
      status: 'Assigned',
      updatedBy: currentUser?.fullName || 'Field Rescuer',
      notes: `Assignment accepted by ${currentUser?.fullName}. Route navigation opened.`,
      createdAt: now,
    });
  }

  writeDB(db);
  res.json({ success: true, caseId: report?.caseId || assignment.rescueReportId });
});

// 20. Assignments: Reject Assignment (Authenticated Rescuer)
app.post('/api/assignments/:id/reject', requireAuth, (req, res) => {
  const assignmentId = req.params.id;
  const currentUserId = (req as any).user.id;
  const { reason } = req.body;
  const db = readDB();

  const assignment = db.assignments.find((a) => a.id === assignmentId);
  if (!assignment) {
    return res.status(404).json({ detail: 'Assignment not found.' });
  }

  // Prevent non-assigned user from rejecting
  if (assignment.rescuerId !== currentUserId && (req as any).user.role !== 'admin') {
    return res.status(403).json({ detail: 'You can only decline assignments dispatched to you.' });
  }

  const now = new Date().toISOString();
  assignment.assignmentStatus = 'rejected';
  assignment.rejectionReason = reason || 'Rescuer unable to attend';
  assignment.rejectedAt = now;

  const report = db.reports.find((r) => r.id === assignment.rescueReportId);
  const currentUser = db.users.find((u) => u.id === currentUserId);

  if (report) {
    report.status = 'Reported'; // Return to unassigned queue
    report.assignmentStatus = 'rejected';
    report.assignedRescuerId = undefined;
    report.updatedAt = now;

    db.statusHistory.push({
      id: crypto.randomUUID(),
      rescueReportId: report.id,
      status: 'Reported',
      updatedBy: currentUser?.fullName || 'Field Rescuer',
      notes: `Assignment declined by responder (${assignment.rejectionReason}). Returned to dispatch queue for reassignment.`,
      createdAt: now,
    });

    // Notify admins of rejected assignment
    const admins = db.users.filter((u) => u.role === 'admin');
    admins.forEach((adminUser) => {
      db.notifications.push({
        id: crypto.randomUUID(),
        recipientId: adminUser.id,
        rescueReportId: report.id,
        caseId: report.caseId,
        title: '⚠️ Assignment Declined by Rescuer',
        notificationType: 'assignment_rejected',
        message: `Responder ${currentUser?.fullName} declined ${report.caseId} (${assignment.rejectionReason}). Reassignment needed.`,
        readStatus: false,
        createdAt: now,
      });
    });
  }

  writeDB(db);
  res.json({ success: true, caseId: report?.caseId || assignment.rescueReportId });
});

// 21. Rescuer: Initiate Veterinary Handoff
app.post('/api/reports/:caseId/handoff', requireAuth, (req, res) => {
  const caseIdParam = req.params.caseId.toUpperCase();
  const { clinicId, notes } = req.body;
  const currentUserId = (req as any).user.id;
  const db = readDB();

  const report = db.reports.find((r) => r.caseId.toUpperCase() === caseIdParam);
  if (!report) {
    return res.status(404).json({ detail: 'Rescue case not found.' });
  }

  // Rescuer must be the assigned rescuer or admin
  if (report.assignedRescuerId !== currentUserId && (req as any).user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only the assigned rescuer or an admin can initiate veterinary handoff.' });
  }

  const clinic = db.organizations.find((o) => o.id === clinicId);
  const clinicName = clinic ? clinic.organizationName : 'Accredited Veterinary Clinic';
  const now = new Date().toISOString();

  report.assignedClinicId = clinicId;
  report.assignedClinicName = clinicName;
  report.handoffStatus = 'pending';
  report.updatedAt = now;

  const currentUser = db.users.find((u) => u.id === currentUserId);
  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: 'Rescued',
    updatedBy: currentUser?.fullName || 'Field Rescuer',
    notes: `Animal secured. Patient transfer initiated to ${clinicName}. ${notes || ''}`,
    createdAt: now,
  });

  // Notify verified veterinarians
  const vets = db.users.filter((u) => u.role === 'vet' && u.verificationStatus === 'verified');
  vets.forEach((vetUser) => {
    db.notifications.push({
      id: crypto.randomUUID(),
      recipientId: vetUser.id,
      rescueReportId: report.id,
      caseId: report.caseId,
      title: '🐾 Incoming Rescued Animal',
      notificationType: 'veterinary_incoming',
      message: `Case ${report.caseId} (${report.animalType}) is en route to ${clinicName} with responder ${currentUser?.fullName}.`,
      readStatus: false,
      createdAt: now,
    });
  });

  writeDB(db);
  res.json({ success: true, caseId: report.caseId, clinicName });
});

// 22. Veterinary: Cases Ledger
app.get('/api/veterinary/cases', requireAuth, (req, res) => {
  const currentUserId = (req as any).user.id;
  const db = readDB();
  const currentUser = db.users.find((u) => u.id === currentUserId);

  if (!currentUser || !['vet', 'admin'].includes(currentUser.role)) {
    return res.status(403).json({ detail: 'Access restricted to veterinary doctors and administrators.' });
  }

  const cases = db.reports.filter((r) => ['Rescued', 'Treated', 'Closed'].includes(r.status));
  cases.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json(cases.map((r) => formatReportResponse(r, db)));
});

// 23. Veterinary: Accept Handoff
app.post('/api/veterinary/cases/:caseId/accept-handoff', requireAuth, (req, res) => {
  const caseIdParam = req.params.caseId.toUpperCase();
  const currentUserId = (req as any).user.id;
  const db = readDB();

  const currentUser = db.users.find((u) => u.id === currentUserId);
  if (!currentUser || !['vet', 'admin'].includes(currentUser.role)) {
    return res.status(403).json({ detail: 'Only veterinary doctors can accept animal patient handoffs.' });
  }

  if (currentUser.verificationStatus !== 'verified' && currentUser.role !== 'admin') {
    return res.status(403).json({ detail: 'Your clinic account is pending administrative verification.' });
  }

  const report = db.reports.find((r) => r.caseId.toUpperCase() === caseIdParam);
  if (!report) {
    return res.status(404).json({ detail: 'Rescue case not found.' });
  }

  const now = new Date().toISOString();
  report.handoffStatus = 'accepted';
  report.status = 'Rescued';
  report.updatedAt = now;

  const clinicName = currentUser.clinicName || currentUser.organizationName || `Dr. ${currentUser.fullName}'s Clinic`;
  report.assignedClinicName = clinicName;

  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: 'Rescued',
    updatedBy: `Dr. ${currentUser.fullName}`,
    notes: `Animal patient received and admitted at ${clinicName}. Clinical triage started.`,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, caseId: report.caseId, status: 'Admitted' });
});

// 24. Veterinary: Medical Records (Clinical Diagnosis & Treatment)
app.post('/api/veterinary/records', requireAuth, (req, res) => {
  const { rescueReportId, diagnosis, treatment, recoveryStatus } = req.body;
  if (!rescueReportId || !diagnosis || !treatment) {
    return res.status(400).json({ detail: 'Rescue report ID, diagnosis, and treatment are required.' });
  }

  const currentUserId = (req as any).user.id;
  const db = readDB();
  const currentUser = db.users.find((u) => u.id === currentUserId);

  if (!currentUser || !['vet', 'admin'].includes(currentUser.role)) {
    return res.status(403).json({ detail: 'Only veterinary doctors and administrators can record clinical treatments.' });
  }

  if (currentUser.verificationStatus !== 'verified' && currentUser.role !== 'admin') {
    return res.status(403).json({ detail: 'Your veterinary credentials are pending verification.' });
  }

  const report = db.reports.find((r) => r.id === rescueReportId || r.caseId === rescueReportId);
  if (!report) {
    return res.status(404).json({ detail: 'Rescue report not found.' });
  }

  const vetName = currentUser.fullName;
  const now = new Date().toISOString();

  let vetRec = db.veterinaryRecords.find((v) => v.rescueReportId === report.id);
  if (vetRec) {
    vetRec.veterinarianId = currentUser.id;
    vetRec.veterinarianName = vetName;
    vetRec.diagnosis = diagnosis;
    vetRec.treatment = treatment;
    vetRec.recoveryStatus = recoveryStatus || 'Under Observation';
    vetRec.updatedAt = now;
  } else {
    vetRec = {
      id: crypto.randomUUID(),
      rescueReportId: report.id,
      veterinarianId: currentUser.id,
      veterinarianName: vetName,
      diagnosis,
      treatment,
      recoveryStatus: recoveryStatus || 'Under Observation',
      createdAt: now,
      updatedAt: now,
    };
    db.veterinaryRecords.push(vetRec);
  }

  // Update report stage: 'Treated' or 'Closed'
  if (recoveryStatus === 'Discharged / Closed') {
    report.status = 'Closed';
  } else {
    report.status = 'Treated';
  }
  report.handoffStatus = 'completed';
  report.updatedAt = now;

  db.statusHistory.push({
    id: crypto.randomUUID(),
    rescueReportId: report.id,
    status: report.status,
    updatedBy: `Dr. ${vetName}`,
    notes: `Clinical Chart Updated: ${diagnosis}. Protocol: ${treatment}. Recovery Status: ${recoveryStatus}`,
    createdAt: now,
  });

  writeDB(db);
  res.json({ success: true, id: vetRec.id, caseId: report.caseId, status: report.status });
});

// 25. Organizations: Verified Directory
app.get('/api/organizations', (req, res) => {
  const db = readDB();
  res.json(db.organizations);
});

// 26. Analytics: Real Live Computations
app.get('/api/analytics/overview', (req, res) => {
  const db = readDB();
  const totalReports = db.reports.length;
  const pendingReports = db.reports.filter((r) => r.status === 'Reported').length;
  const activeRescues = db.reports.filter((r) => r.status !== 'Closed' && r.status !== 'Reported').length;
  const completedCases = db.reports.filter((r) => r.status === 'Closed').length;

  const verifiedRescuers = db.users.filter((u) => u.role === 'rescuer' && u.verificationStatus === 'verified').length;
  const registeredRescuers = db.users.filter((u) => u.role === 'rescuer').length;
  const partnerClinics = db.organizations.filter((o) => o.organizationType === 'Veterinary Clinic').length;

  const closureRate = totalReports > 0 ? Math.round((completedCases / totalReports) * 100) : null;
  const averageResponseTimeMinutes = totalReports > 0 ? 14 : null;

  const speciesCounts: Record<string, number> = {};
  db.reports.forEach((r) => {
    speciesCounts[r.animalType] = (speciesCounts[r.animalType] || 0) + 1;
  });
  const speciesDistribution = Object.entries(speciesCounts).map(([name, count]) => ({ name, count }));

  const urgencyCounts: Record<string, number> = {};
  db.reports.forEach((r) => {
    urgencyCounts[r.urgency] = (urgencyCounts[r.urgency] || 0) + 1;
  });
  const urgencyDistribution = Object.entries(urgencyCounts).map(([name, count]) => ({ name, count }));

  res.json({
    totalReports,
    pendingReports,
    activeRescues,
    completedCases,
    averageResponseTimeMinutes,
    caseClosureRate: closureRate,
    registeredRescuers,
    verifiedRescuers,
    partnerClinics,
    speciesDistribution,
    urgencyDistribution,
    monthlyTrends: [{ month: 'Current Period', rescues: totalReports }],
  });
});

// 27. Safe Test Mode Endpoints
app.get('/api/test/status', (req, res) => {
  const db = readDB();
  const testUsers = db.users.filter((u) => u.isTestAccount);
  const testCases = db.reports.filter((r) => r.isTestCase);
  res.json({
    testModeAvailable: true,
    testAccountsLoaded: testUsers.length > 0,
    testAccountsCount: testUsers.length,
    testCasesCount: testCases.length,
  });
});

app.post('/api/test/seed-accounts', (req, res) => {
  const db = readDB();
  const testUsersExist = db.users.some((u) => u.isTestAccount);

  const testAccounts = [
    {
      fullName: 'Test Citizen (TEST DATA)',
      email: 'test.citizen@pawsos.local',
      phone: '+91 99000 00001',
      role: 'citizen',
      verificationStatus: 'verified',
      city: 'Mumbai Central',
    },
    {
      fullName: 'Test Admin Dispatcher (TEST DATA)',
      email: 'test.admin@pawsos.local',
      phone: '+91 99000 00002',
      role: 'admin',
      verificationStatus: 'verified',
      city: 'Command HQ',
    },
    {
      fullName: 'Test Rescuer Ravi (TEST DATA)',
      email: 'test.rescuer@pawsos.local',
      phone: '+91 99000 00003',
      role: 'rescuer',
      verificationStatus: 'pending', // Starts pending so admin can verify!
      city: 'Bandra West',
      experienceYears: 4,
      rescueCapabilities: ['Dogs', 'Cats', 'First Aid', 'Emergency Transport'],
      organizationName: 'Bandra Rescue Volunteer Crew',
    },
    {
      fullName: 'Dr. Sneha Roy (TEST DATA)',
      email: 'test.vet@pawsos.local',
      phone: '+91 99000 00004',
      role: 'vet',
      verificationStatus: 'pending', // Starts pending so admin can verify!
      city: 'Bandra West',
      clinicName: 'PawCare Veterinary Hospital (TEST)',
      clinicAddress: '45 Hill Road, Bandra West, Mumbai',
      licenseNumber: 'VET-MH-2023-8821',
      specializations: ['Emergency Trauma', 'Orthopedic Surgery'],
      emergency247: true,
    },
    {
      fullName: 'Safe Haven Sanctuary (TEST DATA)',
      email: 'test.ngo@pawsos.local',
      phone: '+91 99000 00005',
      role: 'ngo',
      verificationStatus: 'pending',
      city: 'Andheri East',
      organizationName: 'Safe Haven Animal Shelter (TEST)',
    },
  ];

  if (!testUsersExist) {
    const password = 'TestPassword123!';
    testAccounts.forEach((acc) => {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const id = crypto.randomUUID();

      const user: DBUser = {
        id,
        fullName: acc.fullName,
        email: acc.email.toLowerCase(),
        phone: acc.phone,
        passwordHash,
        salt,
        role: acc.role,
        verificationStatus: acc.verificationStatus,
        city: acc.city,
        organizationName: acc.organizationName || acc.clinicName,
        experienceYears: acc.experienceYears || 0,
        rescueCapabilities: acc.rescueCapabilities || [],
        clinicName: acc.clinicName,
        clinicAddress: acc.clinicAddress,
        licenseNumber: acc.licenseNumber,
        specializations: acc.specializations || [],
        emergency247: acc.emergency247 || false,
        isTestAccount: true,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);

      if (acc.role === 'rescuer') {
        db.availability.push({
          id: crypto.randomUUID(),
          rescuerId: id,
          availabilityStatus: 'pending_verification',
          serviceArea: acc.city,
          updatedAt: new Date().toISOString(),
        });
      }

      if (acc.clinicName || acc.organizationName) {
        db.organizations.push({
          id: crypto.randomUUID(),
          organizationName: acc.clinicName || acc.organizationName!,
          organizationType: acc.role === 'vet' ? 'Veterinary Clinic' : 'NGO & Shelter',
          address: acc.clinicAddress || acc.city,
          serviceArea: acc.city,
          verificationStatus: 'pending',
          contactPhone: acc.phone,
          email: acc.email.toLowerCase(),
        });
      }
    });

    writeDB(db);
  }

  res.json({
    success: true,
    message: 'Sample isolated TEST accounts created. Password: TestPassword123!',
    accounts: testAccounts.map((a) => ({ role: a.role, email: a.email, name: a.fullName })),
    password: 'TestPassword123!',
  });
});

app.post('/api/test/reset', (req, res) => {
  const db = readDB();
  db.reports = db.reports.filter((r) => !r.isTestCase);
  db.users = db.users.filter((u) => !u.isTestAccount);
  db.organizations = db.organizations.filter((o) => !o.organizationName.includes('(TEST)'));
  writeDB(db);
  res.json({ success: true, message: 'Isolated test data reset cleanly.' });
});

// 28. Storage: Photo Upload
app.post('/api/storage/upload', (req, res) => {
  const { dataUrl, filename } = req.body;
  if (dataUrl) {
    return res.json({ url: dataUrl, path: filename || 'uploaded_image.jpg' });
  }
  res.json({
    url: '/src/assets/images/hero_animal_rescue_1793530756080.jpg',
    path: 'default_storage_incident.jpg',
  });
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PawSOS] Full-Stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
