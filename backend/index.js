const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads', 'pets');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const petId = req.params.petId || 'temp';
    const petDir = path.join(__dirname, 'public', 'uploads', 'pets', petId);
    if (!fs.existsSync(petDir)) {
      fs.mkdirSync(petDir, { recursive: true });
    }
    cb(null, petDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `photo${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Middleware
app.use(cors());
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

    const pets = await prisma.pet.findMany({
      where: { householdId: parseInt(householdId) },
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
    const { name, species, breed, age, weight, photoUrl, notes, vetName, vetLocation, vetContact, primaryFood } = req.body;

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
        primaryFood
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
    const { name, species, breed, age, weight, notes, vetName, vetLocation, vetContact, primaryFood, photoOffsetX, photoOffsetY } = req.body;

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
        photoOffsetY: photoOffsetY !== undefined ? photoOffsetY : pet.photoOffsetY
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

    // Save photo path to database
    const photoPath = `/uploads/pets/${petId}/${req.file.filename}`;
    
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
    res.status(500).json({ error: 'Failed to upload photo' });
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

    if (!activityTypeId) {
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

    if (!pet || pet.household.members.length === 0) {
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
      }
    }

    const activity = await prisma.activity.create({
      data: {
        petId: parseInt(petId),
        activityTypeId: finalActivityTypeId,
        userId: req.user.userId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
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

    res.json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        }
      }
    });

    console.log(`✅ Activity updated: ${updatedActivity.id}`);

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

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`🐾 Pet-Sitter API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
