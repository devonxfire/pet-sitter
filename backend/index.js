// ...existing code...
// ...existing code...
// ...existing code...
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const heicConvert = require('heic-convert');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();
// Determine allowed frontend origins (comma-separated env or sensible defaults)
const DEFAULT_FRONTEND_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];
const allowedOrigins = (process.env.FRONTEND_ORIGINS
  ? process.env.FRONTEND_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : (process.env.FRONTEND_ORIGIN ? [process.env.FRONTEND_ORIGIN] : DEFAULT_FRONTEND_ORIGINS)
);

// Enable CORS for the allowed frontend origins (mirrored for Socket.IO below)
// `cors` accepts an array of origins starting with Express 4.x via custom function;
// passing the array directly is fine for development.
 
const app = express();
// Enable CORS for the allowed frontend origins (mirrored for Socket.IO below)
app.use(cors({ origin: allowedOrigins, credentials: true }));
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);
// Socket.IO CORS should mirror allowedOrigins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Authenticate socket connections using the same JWT_SECRET
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(); // allow unauthenticated connections but they won't be able to join rooms
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next();
      socket.user = decoded;
      return next();
    });
  } catch (err) {
    return next();
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  // Auto-join a user-specific room when authenticated so server can target single users
  if (socket.user) {
    try {
      const uid = socket.user.userId || socket.user.id;
      if (uid) {
        socket.join(`user:${uid}`);
        console.log(`Socket ${socket.id} joined user:${uid}`);
      }
    } catch (e) {}
  }

  // Allow client to join household rooms after verifying membership
  socket.on('joinHousehold', async (householdId) => {
    try {
      if (!socket.user) return;
      const member = await prisma.householdMember.findFirst({ where: { householdId: parseInt(householdId), userId: socket.user.userId || socket.user.id } });
      if (member) {
        socket.join(`household:${householdId}`);
        console.log(`Socket ${socket.id} joined household:${householdId}`);
      }
    } catch (err) {
      // ignore
    }
  });

  socket.on('leaveHousehold', (householdId) => {
    try { socket.leave(`household:${householdId}`); } catch (e) {}
  });
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'pets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const petId = req.params.petId || 'temp';
    // Save pet avatar uploads at /uploads/pets/:petId
    // Save activity photos under /uploads/pets/:petId/activities to avoid overwriting the pet avatar
    const isActivityUpload = (req.originalUrl || req.url || '').includes('/activities/photo');
    const baseDir = path.join(__dirname, 'public', 'uploads', 'pets', petId);
    const petDir = isActivityUpload ? path.join(baseDir, 'activities') : baseDir;
    if (!fs.existsSync(petDir)) {
      fs.mkdirSync(petDir, { recursive: true });
    }
    cb(null, petDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    // Use a unique filename to avoid collisions and accidental overwrites
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log('File filter check:', { mimetype: file.mimetype, originalname: file.originalname });
    const allowedMimetypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/heic', 'image/heif'];
    
    if (allowedMimetypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error(`Only image files are allowed. Received: ${file.mimetype}`));
  }
});

// Middleware
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
// Serve uploaded assets directly under /uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// AUTH ROUTES
// ============================================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, firstName, lastName, phoneNumber, isMainMember } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        firstName: firstName || null,
        lastName: lastName || null,
        phoneNumber: phoneNumber || null,
        isMainMember: isMainMember !== undefined ? isMainMember : true
      }
    });

    // After creating a new user, auto-accept any pending household invitations
    try {
      const pendingInvitations = await prisma.householdMember.findMany({
        where: { invitedEmail: user.email.toLowerCase() }
      });

      for (const invitation of pendingInvitations) {
        await prisma.householdMember.update({
          where: { id: invitation.id },
          data: { userId: user.id, invitedEmail: null }
        });
        console.log(`✅ Auto-accepted invitation to household ${invitation.householdId} for new user ${user.email}`);
      }
    } catch (e) {
      console.warn('Failed to auto-accept invitations on signup', e);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ New user created: ${user.email} (${user.name})`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        isMainMember: user.isMainMember
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check for and accept any pending household invitations for this email
    const pendingInvitations = await prisma.householdMember.findMany({
      where: {
        invitedEmail: user.email.toLowerCase()
      }
    });

    for (const invitation of pendingInvitations) {
      await prisma.householdMember.update({
        where: { id: invitation.id },
        data: {
          userId: user.id,
          invitedEmail: null
        }
      });
      console.log(`✅ Auto-accepted invitation to household ${invitation.householdId}`);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`✅ User logged in: ${user.email}`);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HOUSEHOLD ROUTES
// ============================================================================

app.get('/api/households', authenticateToken, async (req, res) => {
  try {
    const households = await prisma.household.findMany({
      where: {
        members: {
          some: {
            userId: req.user.userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        pets: true
      }
    });

    res.json(households);
  } catch (error) {
    console.error('Get households error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/households', authenticateToken, async (req, res) => {
  try {
    const { name, address, city, state, zipCode, country, numberOfMembers, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Household name is required' });
    }

    const household = await prisma.household.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || null,
        numberOfMembers: numberOfMembers ? parseInt(numberOfMembers) : null,
        notes: notes || null,
        members: {
          create: {
            userId: req.user.userId,
            role: 'owner'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        pets: true
      }
    });

    console.log(`✅ Household created: ${household.name} by user ${req.user.userId}`);

    res.json(household);
  } catch (error) {
    console.error('Create household error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Places functionality removed: server no longer proxies Google Places or Mapbox.

// Favourites (server-backed) -------------------------------------------------
app.get('/api/households/:householdId/favourites', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    // Verify membership
    const member = await prisma.householdMember.findFirst({ where: { householdId: parseInt(householdId), userId: req.user.userId } });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const actions = await prisma.favourite.findMany({ where: { householdId: parseInt(householdId) }, orderBy: { ord: 'asc' } });
    res.json(actions);
  } catch (err) {
    console.error('Get favourites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/households/:householdId/favourites', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    // Use `payload` to avoid shadowing and improve clarity
    const { key, label, icon, data: payload } = req.body;

    if (!key || !label) return res.status(400).json({ error: 'key and label are required' });

    // Verify membership
    const member = await prisma.householdMember.findFirst({ where: { householdId: parseInt(householdId), userId: req.user.userId } });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    // Debug: log incoming body to help diagnose 500s during development
    console.log('Create favourite payload:', { userId: req.user.userId, householdId: parseInt(householdId), body: req.body });

    // Prevent duplicates
    const existing = await prisma.favourite.findFirst({ where: { householdId: parseInt(householdId), key } });
    if (existing) return res.status(200).json(existing);

    const maxOrd = await prisma.favourite.aggregate({ _max: { ord: true }, where: { householdId: parseInt(householdId) } });
    // Be defensive: _max or ord may be null depending on Prisma results
    const prevOrd = (maxOrd && maxOrd._max && typeof maxOrd._max.ord === 'number') ? maxOrd._max.ord : 0;
    const ord = prevOrd + 1;

    const qa = await prisma.favourite.create({
      data: { householdId: parseInt(householdId), key, label, icon: icon || null, ord, data: payload || null }
    });

    console.log('Created favourite:', { qa });
    res.json(qa);
  } catch (err) {
    console.error('Create favourite error:', err);
    const payload = { error: err.message || 'Internal server error' };
    if (process.env.NODE_ENV === 'development') payload.details = err.stack;
    res.status(500).json(payload);
  }
});

app.delete('/api/households/:householdId/favourites/:id', authenticateToken, async (req, res) => {
  try {
    const { householdId, id } = req.params;
    // Verify membership
    const member = await prisma.householdMember.findFirst({ where: { householdId: parseInt(householdId), userId: req.user.userId } });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const qa = await prisma.favourite.findUnique({ where: { id: parseInt(id) } });
    if (!qa || qa.householdId !== parseInt(householdId)) return res.status(404).json({ error: 'Not found' });

    // Only delete the favourite shortcut row. Do NOT touch Activity records.
    await prisma.favourite.delete({ where: { id: parseInt(id) } });
    res.json({ success: true, deletedFavouriteId: parseInt(id), note: 'This removes only the favourite shortcut; it does not delete any logged activities.' });
  } catch (err) {
    console.error('Delete favourite error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Replay a favourite: create activities for the saved snapshot
app.post('/api/households/:householdId/favourites/:id/replay', authenticateToken, async (req, res) => {
  try {
    const { householdId, id } = req.params;

    console.log(`Replay requested by user ${req.user?.userId} for household ${householdId}, favourite ${id}`);

    // Verify membership
    const member = await prisma.householdMember.findFirst({ where: { householdId: parseInt(householdId), userId: req.user.userId } });
    console.log('Membership check result for replay:', { member });
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const qa = await prisma.favourite.findUnique({ where: { id: parseInt(id) } });
    console.log('Found favourite:', { qa });
    if (!qa || qa.householdId !== parseInt(householdId)) {
      console.warn('Favourite not found or household mismatch', { requestedId: id, householdId, found: qa });
      return res.status(404).json({ error: 'Favourite not found', details: `requestedId=${id}, householdId=${householdId}, found=${qa ? 'exists' : 'missing'}` });
    }

    const payload = qa.data || {};

    // Allow client to override target pets by sending { petId } or { petIds } in the POST body.
    const overridePetId = req.body?.petId;
    const overridePetIds = req.body?.petIds;

    // Determine target pet ids
    let targetIds = [];
    if (overridePetIds && Array.isArray(overridePetIds) && overridePetIds.length > 0) {
      // validate override pet ids belong to household
      const pets = await prisma.pet.findMany({ where: { householdId: parseInt(householdId), id: { in: overridePetIds.map(id => parseInt(id)) } }, select: { id: true } });
      targetIds = pets.map(p => p.id);
    } else if (overridePetId) {
      const pet = await prisma.pet.findUnique({ where: { id: parseInt(overridePetId) }, select: { id: true, householdId: true } });
      if (pet && pet.householdId === parseInt(householdId)) targetIds = [pet.id];
      else targetIds = [];
    } else if (payload.applyToAll) {
      const pets = await prisma.pet.findMany({ where: { householdId: parseInt(householdId) }, select: { id: true } });
      targetIds = pets.map(p => p.id);
    } else if (Array.isArray(payload.petIds) && payload.petIds.length > 0) {
      // ensure petIds belong to household
      const pets = await prisma.pet.findMany({ where: { householdId: parseInt(householdId), id: { in: payload.petIds.map(id => parseInt(id)) } }, select: { id: true } });
      targetIds = pets.map(p => p.id);
    } else {
      return res.status(400).json({ error: 'No target pets found for favourite' });
    }

    // For each target pet, create or find activityType by name (qa.key) and create activity
    const created = [];
    // Allow client to pass a timestamp override (ISO string). Fallback to payload.timestamp, then server time.
    const overrideTimestamp = req.body?.timestamp || (payload && payload.timestamp);
    let parsedOverrideTs = overrideTimestamp ? new Date(overrideTimestamp) : null;
    if (parsedOverrideTs && isNaN(parsedOverrideTs.getTime())) parsedOverrideTs = null;

    for (const pid of targetIds) {
      // find or create activity type for this pet
      let activityTypeId = null;
      if (qa.key) {
        const existing = await prisma.activityType.findFirst({ where: { petId: pid, name: qa.key } });
        if (existing) activityTypeId = existing.id;
        else {
          const createdType = await prisma.activityType.create({ data: { petId: pid, name: qa.key, frequency: 'on-demand' } });
          activityTypeId = createdType.id;
        }
      } else {
        return res.status(400).json({ error: 'Favourite missing activity key' });
      }

      const activity = await prisma.activity.create({
        data: {
          petId: pid,
          activityTypeId,
          userId: req.user.userId,
          timestamp: parsedOverrideTs ? parsedOverrideTs : new Date(),
          notes: payload.notes || null,
          data: payload.data || {}
        },
        include: {
          activityType: true,
          user: { select: { id: true, name: true } }
        }
      });

      created.push(activity);
    }

    // Emit real-time events for each created activity so other household members receive them instantly
    try {
      const householdIdNum = parseInt(householdId);
      if (typeof io !== 'undefined' && householdIdNum) {
        console.debug(`Emitting ${created.length} favourite activity events for household:${householdIdNum}`);
        for (const activity of created) {
          try {
            console.debug('Emitting newActivity for activity id', activity.id, 'to household', householdIdNum);
            io.to(`household:${householdIdNum}`).emit('newActivity', { activity });
          } catch (e) {
            console.warn('Failed to emit newActivity to household room', e);
          }
        }

        // Also emit to individual user rooms for reliability
        const members = await prisma.householdMember.findMany({ where: { householdId: householdIdNum, userId: { not: null } }, select: { userId: true } });
        for (const m of members) {
          for (const activity of created) {
            try {
              console.debug('Emitting newActivity for activity id', activity.id, 'to user', m.userId);
              io.to(`user:${m.userId}`).emit('newActivity', { activity });
            } catch (e) {
              console.warn('Failed to emit newActivity to user room', m.userId, e);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Failed to emit socket events for favourite replay', err);
    }

    res.json(created.sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp)));
  } catch (err) {
    console.error('Replay quick action error:', err);
    // Return error message in development for easier debugging
    const payload = { error: err.message || 'Internal server error' };
    if (process.env.NODE_ENV === 'development') payload.details = err.stack;
    res.status(500).json(payload);
  }
});

// ============================================================================
// PET ROUTES
// ============================================================================

app.get('/api/households/:householdId/pets', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;

    const member = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        userId: req.user.userId
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied to this household' });
    }

    // Support filtering by draft status: /api/households/:householdId/pets?draft=true|false
    let draftFilter = {};
    if (typeof req.query.draft !== 'undefined') {
      draftFilter.draft = req.query.draft === 'true';
    }
    const pets = await prisma.pet.findMany({
      where: { householdId: parseInt(householdId), ...draftFilter },
      include: {
        activityTypes: true
      }
    });
    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/households/:householdId/pets', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const { name, species, breed, age, weight, photoUrl, notes, vetName, vetLocation, vetContact, primaryFood, draft } = req.body;

    if (!name || !species) {
      return res.status(400).json({ error: 'Pet name and species are required' });
    }

    const member = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        userId: req.user.userId
      }
    });

    if (!member) {
      return res.status(403).json({ error: 'Access denied to this household' });
    }

    const pet = await prisma.pet.create({
      data: {
        householdId: parseInt(householdId),
        name,
        species: species.toLowerCase(),
        breed,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        photoUrl,
        notes,
        vetName,
        vetLocation,
        vetContact,
        primaryFood,
        weightUnit: req.body.weightUnit || 'lbs',
        draft: typeof draft === 'boolean' ? draft : false,
      },
      include: {
        activityTypes: true
      }
    });

    console.log(`✅ Pet created: ${pet.name} (${pet.species}) in household ${householdId}`);

    res.json(pet);
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/pets/:petId', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;

    const pet = await prisma.pet.findUnique({
      where: { id: parseInt(petId) },
      include: {
        household: {
          include: {
            members: {
              where: { userId: req.user.userId }
            }
          }
        },
        activityTypes: true
      }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.household.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(pet);
  } catch (error) {
    console.error('Get pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/pets/:petId', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const { name, species, breed, age, weight, notes, vetName, vetLocation, vetContact, primaryFood, photoOffsetX, photoOffsetY, draft } = req.body;

    console.log(`📝 Updating pet ${petId} with data:`, { name, species, breed, age, weight, notes, vetName, vetLocation, vetContact, primaryFood, photoOffsetX, photoOffsetY });

    // Verify user has access to this pet
    const pet = await prisma.pet.findUnique({
      where: { id: parseInt(petId) },
      include: {
        household: {
          include: {
            members: {
              where: { userId: req.user.userId }
            }
          }
        }
      }
    });

    if (!pet) {
      console.error(`Pet ${petId} not found`);
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.household.members.length === 0) {
      console.error(`User ${req.user.userId} has no access to pet ${petId}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update pet
    const updatedPet = await prisma.pet.update({
      where: { id: parseInt(petId) },
      data: {
        name: name || pet.name,
        species: species || pet.species,
        breed: breed !== undefined ? breed : pet.breed,
        age: age !== undefined ? age : pet.age,
        weight: weight !== undefined ? weight : pet.weight,
        notes: notes !== undefined ? notes : pet.notes,
        vetName: vetName !== undefined ? vetName : pet.vetName,
        vetLocation: vetLocation !== undefined ? vetLocation : pet.vetLocation,
        vetContact: vetContact !== undefined ? vetContact : pet.vetContact,
        primaryFood: primaryFood !== undefined ? primaryFood : pet.primaryFood,
        photoOffsetX: photoOffsetX !== undefined ? photoOffsetX : pet.photoOffsetX,
        photoOffsetY: photoOffsetY !== undefined ? photoOffsetY : pet.photoOffsetY,
        weightUnit: req.body.weightUnit !== undefined ? req.body.weightUnit : pet.weightUnit,
        draft: typeof draft === 'boolean' ? draft : pet.draft,
      },
      include: {
        activityTypes: true
      }
    });

    console.log(`✅ Pet updated: ${updatedPet.name}`);

    res.json(updatedPet);
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete pet
app.delete('/api/pets/:petId', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;

    // Verify user has access to this pet
    const pet = await prisma.pet.findUnique({
      where: { id: parseInt(petId) },
      include: {
        household: {
          include: {
            members: {
              where: { userId: req.user.userId }
            }
          }
        }
      }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.household.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete pet and related data (cascade)
    await prisma.pet.delete({
      where: { id: parseInt(petId) }
    });

    console.log(`🗑️ Pet deleted: ${petId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload pet photo
app.post('/api/pets/:petId/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const petId = parseInt(req.params.petId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify pet exists and user has permission
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { household: true }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    // Check if user is part of the household
    const householdMember = await prisma.householdMember.findFirst({
      where: {
        householdId: pet.householdId,
        userId: req.user.id
      }
    });

    if (!householdMember) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Convert HEIC/HEIF to JPEG for browser compatibility
    let finalFilename = req.file.filename;
    const uploadedPath = req.file.path;

    if (req.file.mimetype === 'image/heic' || req.file.mimetype === 'image/heif') {
      // Preserve generated base name but use .jpg extension
      const base = path.basename(req.file.filename, path.extname(req.file.filename));
      const jpegFilename = `${base}.jpg`;
      const jpegPath = path.join(path.dirname(uploadedPath), jpegFilename);

      const inputBuffer = await fs.promises.readFile(uploadedPath);
      const outputBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });

      await fs.promises.writeFile(jpegPath, outputBuffer);

      // Delete original HEIC file
      fs.unlinkSync(uploadedPath);
      finalFilename = jpegFilename;
    }

    // Save photo path to database (pet avatar directory)
    const photoPath = `/uploads/pets/${petId}/${finalFilename}`;
    
    const updatedPet = await prisma.pet.update({
      where: { id: petId },
      data: {
        photoUrl: photoPath
      },
      include: { activityTypes: true }
    });

    console.log(`✅ Pet photo uploaded: ${pet.name} -> ${photoPath}`);

    res.json(updatedPet);
  } catch (error) {
    console.error('Photo upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to upload photo',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Upload activity photo (returns a path that can be stored on the activity)
app.post('/api/pets/:petId/activities/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    const petId = parseInt(req.params.petId);

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify pet exists and user has permission
    const pet = await prisma.pet.findUnique({ where: { id: petId }, include: { household: true } });
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    const householdMember = await prisma.householdMember.findFirst({ where: { householdId: pet.householdId, userId: req.user.id } });
    if (!householdMember) return res.status(403).json({ error: 'Unauthorized' });

    // Convert HEIC/HEIF to JPEG if needed and preserve base name
    let finalFilename = req.file.filename;
    const uploadedPath = req.file.path;
    if (req.file.mimetype === 'image/heic' || req.file.mimetype === 'image/heif') {
      const base = path.basename(req.file.filename, path.extname(req.file.filename));
      const jpegFilename = `${base}.jpg`;
      const jpegPath = path.join(path.dirname(uploadedPath), jpegFilename);
      const inputBuffer = await fs.promises.readFile(uploadedPath);
      const outputBuffer = await heicConvert({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
      await fs.promises.writeFile(jpegPath, outputBuffer);
      fs.unlinkSync(uploadedPath);
      finalFilename = jpegFilename;
    }

    // Activity photos are stored under the activities subfolder
    const photoPath = `/uploads/pets/${petId}/activities/${finalFilename}`;
    console.log(`✅ Activity photo uploaded: ${photoPath}`);

    return res.json({ photoPath });
  } catch (error) {
    console.error('Activity photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload activity photo' });
  }
});

// ============================================================================
// ACTIVITY ROUTES
// ============================================================================

app.get('/api/pets/:petId/activities', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const pet = await prisma.pet.findUnique({
      where: { id: parseInt(petId) },
      include: {
        household: {
          include: {
            members: {
              where: { userId: req.user.userId }
            }
          }
        }
      }
    });

    if (!pet || pet.household.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await prisma.activity.findMany({
      where: { petId: parseInt(petId) },
      include: {
        activityType: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pets/:petId/activities', authenticateToken, async (req, res) => {
  try {
    const { petId } = req.params;
    const { activityTypeId, timestamp, notes, photoUrl, data } = req.body;
    console.log('[ACTIVITY][POST] Incoming:', { petId, activityTypeId, timestamp, notes, photoUrl, data, userId: req.user.userId });

    // Validate timestamp
    let parsedTimestamp = null;
    if (timestamp) {
      parsedTimestamp = new Date(timestamp);
      if (isNaN(parsedTimestamp.getTime())) {
        console.warn('[ACTIVITY][POST] Invalid timestamp:', timestamp);
        return res.status(400).json({ error: 'Invalid timestamp' });
      }
      // Log if timestamp is in the future or past
      const now = new Date();
      if (parsedTimestamp > now) {
        console.log('[ACTIVITY][POST] Timestamp is in the future:', parsedTimestamp.toISOString());
      } else {
        console.log('[ACTIVITY][POST] Timestamp is in the past or now:', parsedTimestamp.toISOString());
      }
    } else {
      parsedTimestamp = new Date();
      console.log('[ACTIVITY][POST] No timestamp provided, using now:', parsedTimestamp.toISOString());
    }

    if (!activityTypeId) {
      console.warn('[ACTIVITY][POST] Missing activityTypeId');
      return res.status(400).json({ error: 'Activity type is required' });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: parseInt(petId) },
      include: {
        household: {
          include: {
            members: {
              where: { userId: req.user.userId }
            }
          }
        }
      }
    });
    if (!pet) {
      console.warn('[ACTIVITY][POST] Pet not found:', petId);
    }
    if (!pet || pet.household.members.length === 0) {
      console.warn('[ACTIVITY][POST] Access denied for user', req.user.userId, 'on pet', petId);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Handle activity type: if activityTypeId is a string (e.g., 'feeding'), find or create it
    let finalActivityTypeId = activityTypeId;
    if (typeof activityTypeId === 'string') {
      const activityType = await prisma.activityType.findFirst({
        where: {
          petId: parseInt(petId),
          name: activityTypeId
        }
      });
      if (activityType) {
        finalActivityTypeId = activityType.id;
        console.log('[ACTIVITY][POST] Found existing activityType:', activityTypeId, '->', finalActivityTypeId);
      } else {
        // Create activity type if it doesn't exist
        const newActivityType = await prisma.activityType.create({
          data: {
            petId: parseInt(petId),
            name: activityTypeId,
            frequency: 'on-demand'
          }
        });
        finalActivityTypeId = newActivityType.id;
        console.log('[ACTIVITY][POST] Created new activityType:', activityTypeId, '->', finalActivityTypeId);
      }
    }

    try {
      const activity = await prisma.activity.create({
        data: {
          petId: parseInt(petId),
          activityTypeId: finalActivityTypeId,
          userId: req.user.userId,
          timestamp: parsedTimestamp,
          notes,
          photoUrl,
          data: data || {}
        },
        include: {
          activityType: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      console.log(`✅ Activity logged: ${activity.activityType.name} for pet ${petId} by user ${req.user.userId}`);

      // Emit real-time event to household room (if socket server available)
      try {
        const householdId = pet && pet.household && (pet.household.id || pet.householdId);
        if (typeof io !== 'undefined' && householdId) {
          io.to(`household:${householdId}`).emit('newActivity', { activity });
          // Also target each member's personal room so users who didn't join household rooms still get it
          const members = await prisma.householdMember.findMany({ where: { householdId: parseInt(householdId), userId: { not: null } }, select: { userId: true } });
          members.forEach(m => {
            try { io.to(`user:${m.userId}`).emit('newActivity', { activity }); } catch (e) {}
          });
        }
      } catch (err) {
        console.warn('Failed to emit socket newActivity', err);
      }

      res.json(activity);
    } catch (dbErr) {
      console.error('[ACTIVITY][POST] DB error:', dbErr);
      return res.status(500).json({ error: 'Failed to create activity', details: dbErr.message });
    }
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.patch('/api/activities/:activityId', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;
    const { timestamp, notes } = req.body;

    // Get activity and verify user has access
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        pet: {
          include: {
            household: {
              include: {
                members: {
                  where: { userId: req.user.userId }
                }
              }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.pet.household.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update activity
    const updatedActivity = await prisma.activity.update({
      where: { id: parseInt(activityId) },
      data: {
        timestamp: timestamp ? new Date(timestamp) : activity.timestamp,
        notes: notes !== undefined ? notes : activity.notes
      },
      include: {
        activityType: true,
        user: {
          select: {
            id: true,
            name: true
          }
        },
        pet: {
          include: {
            household: true
          }
        }
      }
    });

    console.log(`✅ Activity updated: ${updatedActivity.id}`);
    try {
      const householdId = updatedActivity.pet && (updatedActivity.pet.household?.id || updatedActivity.pet.householdId);
      if (typeof io !== 'undefined' && householdId) {
        // include editor info so clients can show who performed the update
        const editor = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true, name: true } });
        const payloadActivity = { ...updatedActivity, editedBy: editor || null };

        io.to(`household:${householdId}`).emit('updatedActivity', { activity: payloadActivity });
        const members = await prisma.householdMember.findMany({ where: { householdId: parseInt(householdId), userId: { not: null } }, select: { userId: true } });
        members.forEach(m => {
          try { io.to(`user:${m.userId}`).emit('updatedActivity', { activity: payloadActivity }); } catch (e) {}
        });
      }
    } catch (err) {
      console.warn('Failed to emit socket updatedActivity', err);
    }

    res.json(updatedActivity);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/activities/:activityId', authenticateToken, async (req, res) => {
  try {
    const { activityId } = req.params;

    // Get activity and verify user has access
    const activity = await prisma.activity.findUnique({
      where: { id: parseInt(activityId) },
      include: {
        pet: {
          include: {
            household: {
              include: {
                members: {
                  where: { userId: req.user.userId }
                }
              }
            }
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.pet.household.members.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete activity
    await prisma.activity.delete({
      where: { id: parseInt(activityId) }
    });

    console.log(`✅ Activity deleted: ${activityId}`);

    // Emit deletion to household room
    try {
      const householdId = activity.pet && (activity.pet.household?.id || activity.pet.householdId);
      if (typeof io !== 'undefined' && householdId) {
        io.to(`household:${householdId}`).emit('deletedActivity', { activityId: parseInt(activityId) });
        const members = await prisma.householdMember.findMany({ where: { householdId: parseInt(householdId), userId: { not: null } }, select: { userId: true } });
        members.forEach(m => {
          try { io.to(`user:${m.userId}`).emit('deletedActivity', { activityId: parseInt(activityId) }); } catch (e) {}
        });
      }
    } catch (err) {
      console.warn('Failed to emit socket deletedActivity', err);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HOUSEHOLD MEMBERS ROUTES
// ============================================================================

// Get all members (including pending invitations) for a household
app.get('/api/households/:householdId/members', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;

    // Verify user has access to this household
    const access = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        userId: req.user.id
      }
    });

    if (!access) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const members = await prisma.householdMember.findMany({
      where: { householdId: parseInt(householdId) },
      include: {
        user: {
          select: { id: true, email: true, name: true, firstName: true, lastName: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(members);
  } catch (error) {
    console.error('Get household members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invite a new member by email
app.post('/api/households/:householdId/members/invite', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify user is owner/main member of household
    const access = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        userId: req.user.id,
        role: { in: ['owner', 'member'] }
      }
    });

    if (!access) {
      return res.status(403).json({ error: 'Only owners/members can invite' });
    }

    // Check if email already invited or is a member
    const existing = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        OR: [
          { invitedEmail: email.toLowerCase() },
          { user: { email: email.toLowerCase() } }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'User already invited or is a member' });
    }

    // Create pending invitation
    const invitation = await prisma.householdMember.create({
      data: {
        householdId: parseInt(householdId),
        invitedEmail: email.toLowerCase(),
        role: role || 'member'
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    console.log(`✅ Invitation sent to ${email} for household ${householdId}`);
    res.status(201).json(invitation);
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept invitation (when invited user logs in with matching email)
app.post('/api/households/:householdId/members/accept-invitation', authenticateToken, async (req, res) => {
  try {
    const { householdId } = req.params;
    const userEmail = req.user.email;

    // Find pending invitation for this email
    const invitation = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        invitedEmail: userEmail.toLowerCase()
      }
    });

    if (!invitation) {
      return res.status(404).json({ error: 'No invitation found' });
    }

    // Update invitation with userId, clear invitedEmail
    const updated = await prisma.householdMember.update({
      where: { id: invitation.id },
      data: {
        userId: req.user.id,
        invitedEmail: null
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, firstName: true, lastName: true }
        }
      }
    });

    console.log(`✅ ${userEmail} accepted invitation to household ${householdId}`);
    res.json(updated);
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: check pending invitations for an email (used by signup flow)
app.get('/api/invitations', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    const invitations = await prisma.householdMember.findMany({
      where: { invitedEmail: email.toLowerCase() },
      select: { id: true, householdId: true, invitedEmail: true, role: true }
    });

    res.json(invitations || []);
  } catch (err) {
    console.error('GET /api/invitations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a member from household
app.delete('/api/households/:householdId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { householdId, memberId } = req.params;

    // Verify user is owner of household
    const access = await prisma.householdMember.findFirst({
      where: {
        householdId: parseInt(householdId),
        userId: req.user.id,
        role: 'owner'
      }
    });

    if (!access) {
      return res.status(403).json({ error: 'Only owners can remove members' });
    }

    await prisma.householdMember.delete({
      where: { id: parseInt(memberId) }
    });

    console.log(`✅ Member ${memberId} removed from household ${householdId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Current user endpoints
// ---------------------------------------------------------------------------

// Get current authenticated user
app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isMainMember: true,
        createdAt: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Get /api/me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update current authenticated user (name, phone, etc.)
app.patch('/api/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { name, firstName, lastName, phoneNumber } = req.body;

    const updated = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        name: name !== undefined ? name : undefined,
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        isMainMember: true,
        createdAt: true
      }
    });

    console.log(`✅ User ${userId} updated their profile`);
    res.json(updated);
  } catch (error) {
    console.error('Patch /api/me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password while authenticated
app.post('/api/me/password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: parseInt(userId) }, data: { passwordHash: hash } });

    console.log(`🔒 User ${userId} changed password`);
    res.json({ success: true });
  } catch (error) {
    console.error('POST /api/me/password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

server.listen(PORT, () => {
  console.log(`🐾 Pet-Sitter API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
