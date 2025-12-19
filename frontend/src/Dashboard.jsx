import React, { useState, useEffect } from 'react';
import AddPetWizardModal from './components/AddPetWizardModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch, API_BASE } from './api';
import { getFallbackFlower, assignHouseholdFlowers, FLOWER_LIST } from './flowerIcon';
// ...existing code...

export default function Dashboard({ user, household, onSignOut }) {
    const [hoveredPetIdx, setHoveredPetIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardData, setWizardData] = useState(null);

  const [petToDelete, setPetToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeletePet = (pet) => {
    setPetToDelete(pet);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePet = async () => {
    if (!petToDelete) return;
    try {
      await apiFetch(`/api/pets/${petToDelete.id}`, { method: 'DELETE' });
      setPets((prev) => prev.filter((p) => p.id !== petToDelete.id));
    } catch (err) {
      alert('Failed to delete pet: ' + (err?.error || err?.message || err));
    } finally {
      setShowDeleteConfirm(false);
      setPetToDelete(null);
    }
  };

  const cancelDeletePet = () => {
    setShowDeleteConfirm(false);
    setPetToDelete(null);
  };

  const resolvePhotoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };


  useEffect(() => {
    const fetchPets = async () => {
      if (!household?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch(`/api/households/${household.id}/pets`);
        setPets(data);
      } catch (err) {
        console.error('Failed to fetch pets:', err);
      } finally {
        setLoading(false);
      }
    };

    console.log('Dashboard household:', household); // Debug log
    fetchPets();
  }, [household?.id, location.state?.petAdded]);

  // Pre-compute household flower mapping so JSX is simpler and deterministic
  const mapping = assignHouseholdFlowers(pets || []);

  const handleWizardNext = (data) => {
    setShowWizard(false);
    setWizardData(data);
    setPets((prev) => {
      // If pet exists (update), replace it; else, add new
      const exists = prev.some((p) => p.id === data.id);
      if (exists) {
        return prev.map((p) => (p.id === data.id ? data : p));
      } else {
        return [...prev, data];
      }
    });
    navigate('/dashboard');
  };

  const handleWizardOpen = () => setShowWizard(true);
  const handleWizardClose = () => setShowWizard(false);

  // Pre-populate vet info from first pet if available
  const previousVetInfo = pets && pets.length > 0 ? {
    vetName: pets[0].vetName || '',
    vetLocation: pets[0].vetLocation || '',
    vetContact: pets[0].vetContact || ''
  } : undefined;

  // Handle draft save from wizard modal
  const handleDraftSave = (draftPet) => {
    setPets((prevPets) => {
      // If pet exists (update), replace it; else, add new
      const exists = prevPets.some((p) => p.id === draftPet.id);
      if (exists) {
        return prevPets.map((p) => (p.id === draftPet.id ? draftPet : p));
      } else {
        return [...prevPets, draftPet];
      }
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {showWizard && (
        <AddPetWizardModal
          open={true}
          onNext={handleWizardNext}
          onClose={handleWizardClose}
          previousVetInfo={previousVetInfo}
          householdId={household?.id}
          wizardData={wizardData}
          onDraftSave={handleDraftSave}
        />
      )}
      {/* Header band: match Profile/PetActivities header UI for consistency */}
      <div
        className="w-full mb-10 flex items-center justify-center"
        style={{
          backgroundImage: 'url(/hero-pets.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '320px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          className="flex flex-col items-center justify-center w-full"
          style={{
            background: 'rgba(0,0,0,0.45)',
            minHeight: '320px',
            width: '100%',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {household?.name && (
            <h1
              className="font-extrabold mb-2"
              style={{
                color: '#fff',
                fontSize: '3rem',
                lineHeight: 1.1,
                textShadow: '0 2px 16px rgba(0,0,0,0.35)',
                letterSpacing: '-1px',
                margin: 0,
                padding: 0,
                fontWeight: 900,
                maxWidth: '90vw',
              }}
            >
              <span className="heading-light" style={{ fontWeight: 300, fontSize: '2.5rem' }}>Welcome,</span>
              <br />
              <span style={{ fontWeight: 900, fontSize: '3.5rem' }}>{household.name}!</span>
            </h1>
          )}
        </div>
      </div>
      <main className="flex justify-center py-0">
        <div className="max-w-6xl px-6 w-full">

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">Welcome! Let's set up your first pet.</p>
            <button
              onClick={handleWizardOpen}
              className="flex items-center gap-2 px-4 py-2 text-base font-normal transition cursor-pointer shadow"
              style={{
                background: '#10B981',
                backgroundColor: '#10B981',
                color: '#fff',
                boxShadow: '0 4px 16px 0 rgba(0,0,0,0.18)',
                borderRadius: '0.75rem',
                minWidth: '110px',
                fontWeight: 400,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#059669';
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#10B981';
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Pet
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-normal" style={{ color: '#6b7280' }}>Your Pets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet, idx) => {
                // Determine border logic: default on first, or on hovered
                const isDefault = hoveredPetIdx === null && idx === 0;
                const isHovered = hoveredPetIdx === idx;
                const borderClass = isDefault ? 'pet-card-default' : isHovered ? 'pet-card-hovered' : '';
                return (
                  <React.Fragment key={pet.id}>
                    <div
                      className={`bg-gray-50 rounded-2xl p-6 border border-gray-200 transition-transform duration-300 ease-in-out transform-gpu hover:scale-105 hover:shadow-xl flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-4 relative group cursor-pointer pet-card-fix ${borderClass}`}
                      onMouseEnter={() => setHoveredPetIdx(idx)}
                      onMouseLeave={() => setHoveredPetIdx(null)}
                      onClick={() => {
                        if (pet.draft) {
                          setShowWizard(true);
                          setWizardData({ ...pet, resumeDraft: true });
                        } else {
                          navigate(`/pet/${pet.id}/activities`);
                        }
                      }}
                    >
                      {/* Text content next to avatar (match avatar height) */}
                      <div className="flex-1 h-28 md:h-32 flex flex-col justify-between">
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {pet.name}
                          </h2>
                          <p className="text-sm md:text-base text-gray-600 mt-1">
                            {(pet.species || '').charAt(0).toUpperCase() + (pet.species || '').slice(1)}{pet.breed ? ` • ${pet.breed}` : ''}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          {pet.age && <div>Age: {pet.age} years</div>}
                          {pet.weight && <div>Weight: {pet.weight} {pet.weightUnit || 'lbs'}</div>}
                        </div>
                      </div>
                      {/* Red border effect for first or hovered card */}
                      <style>{`
                        .pet-card-fix {
                          box-shadow: none;
                          position: relative;
                        }
                        .pet-card-fix.pet-card-default,
                        .pet-card-fix.pet-card-hovered {
                          box-shadow: 0 0 0 4px #C3001F inset;
                          box-shadow: 0 4px 0 0 #C3001F inset;
                        }
                        .pet-card-fix.pet-card-default,
                        .pet-card-fix.pet-card-hovered {
                          box-shadow: 0 -4px 0 0 #C3001F inset !important;
                        }
                      `}</style>
                      {/* Delete button (X icon) - top right, smaller */}
                      <button
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-600 bg-white rounded-full p-0.5 shadow group-hover:opacity-100 opacity-70 transition cursor-pointer"
                        title="Delete pet"
                        onClick={e => { e.stopPropagation(); handleDeletePet(pet); }}
                        style={{ zIndex: 20 }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 14L14 6M6 6l8 8" />
                        </svg>
                      </button>
                      {/* Draft badge */}
                      {pet.draft && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded shadow text-gray-900">Draft</span>
                      )}
                      {/* Rounded-square Photo */}
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gray-200 border-2 border-gray-200 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                        {pet.photoUrl ? (
                          <img
                            src={resolvePhotoUrl(pet.photoUrl)}
                            alt={pet.name}
                            className="w-full h-full object-cover select-none"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
            {/* Delete confirmation modal (only one, outside map) */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-6 text-center">
                  <h3 className="text-lg font-semibold mb-3 text-red-700">Delete Pet?</h3>
                  <p className="text-gray-700 mb-6">This will permanently remove <b>{petToDelete?.name}</b> and <b>all data relating to this pet</b> (activities, photos, etc). This action cannot be undone.</p>
                  <div className="flex gap-3 justify-center">
                    <button className="btn px-4 py-2 bg-gray-100 text-gray-700" onClick={cancelDeletePet}>Cancel</button>
                    <button className="btn btn-red px-4 py-2" onClick={confirmDeletePet}>Delete</button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-start mt-12 mb-8">
              <button
                onClick={handleWizardOpen}
                className="btn text-lg font-semibold px-5 py-2 hover:opacity-90 transition shadow rounded-lg"
                style={{ letterSpacing: '0.02em' }}
              >
                + Add Pet
              </button>
            </div>
            {/* Household section removed */}
          </div>
        )}
        </div>
      </main>
    </div>
  );
}