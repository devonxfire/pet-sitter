const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Middleware
app.use(cors());
app.use(express.json());

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
    const { name, species, breed, age, weight, photoUrl, notes } = req.body;

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
        notes
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
    const { name, species, breed, age, weight, notes } = req.body;

    console.log(`📝 Updating pet ${petId} with data:`, { name, species, breed, age, weight, notes });

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
        notes: notes !== undefined ? notes : pet.notes
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

    const activity = await prisma.activity.create({
      data: {
        petId: parseInt(petId),
        activityTypeId: parseInt(activityTypeId),
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
