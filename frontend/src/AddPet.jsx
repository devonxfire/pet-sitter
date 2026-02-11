import React, { useState, useEffect, useRef } from 'react';
import ThemeSpinner from './ThemeSpinner';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from './api';
import './components/AddPetWizardModal.css';
// PlacesSearch removed — address entered manually now
export default function AddPet({ user, household, onSignOut }) {
	const navigate = useNavigate();
	const location = useLocation();
	const householdFromState = location.state?.household;
	const activeHousehold = household || householdFromState;

	// Add Pet Wizard modal state


	const wizardData = location.state?.wizardData;
	const [petName, setPetName] = useState(wizardData?.petName || '');
	const [species, setSpecies] = useState(wizardData?.species || 'dog');
	const [breed, setBreed] = useState(wizardData?.breed || '');
	const [breedsList, setBreedsList] = useState([]);
	const [breedSuggestions, setBreedSuggestions] = useState([]);
	const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
	const [focusedSuggestion, setFocusedSuggestion] = useState(-1);
	const breedInputRef = useRef(null);
	const suggestionsRef = useRef(null);
	const [age, setAge] = useState(wizardData?.age || '');
	const [weight, setWeight] = useState(wizardData?.weight || '');
	const [weightUnit, setWeightUnit] = useState(wizardData?.weightUnit || 'kg');
	const [notes, setNotes] = useState(wizardData?.notes || '');
	const [vetName, setVetName] = useState(wizardData?.vetName || '');
	const [vetLocation, setVetLocation] = useState(wizardData?.vetLocation || '');
	const [vetContact, setVetContact] = useState(wizardData?.vetContact || '');
	// Places/Mapbox removed — users enter address text manually
	// const [primaryFood, setPrimaryFood] = useState(wizardData?.primaryFood || '');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	// Pre-populate vet info and food if household has pets

	// Handle form submit
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			if (
				!petName.trim() ||
				!species ||
				breed.trim() === '' ||
				age === '' ||
				weight === ''
			) {
				setError('Please complete all required fields (Pet name, Species, Breed, Age, Weight)');
				setLoading(false);
				return;
			}
			if (!activeHousehold) {
				setError('No household found. Please create a household first.');
				setLoading(false);
				return;
			}
			const data = await apiFetch(`/api/households/${activeHousehold.id}/pets`, {
				method: 'POST',
				body: JSON.stringify({
					name: petName.trim(),
					species: species.toLowerCase(),
					breed: breed || null,
					age: age ? parseInt(age) : null,
					weight: weight ? parseFloat(weight) : null,
					weightUnit: weightUnit || 'kg',
					notes: notes || null,
					vetName: vetName || null,
					vetLocation: vetLocation || null,
					vetContact: vetContact || null,
	//          primaryFood: primaryFood || null,
				}),
			});
			console.log('✅ Pet created:', data);
			navigate('/dashboard', { state: { household: activeHousehold, petAdded: true } });
		} catch (err) {
			setError(err.message || 'Failed to create pet');
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-white">
				<ThemeSpinner label="Creating pet..." />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white">
			<main className="flex justify-center py-8">
				<div className="max-w-6xl px-6 mt-4 w-full">
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-gray-900">Add a Pet</h1>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* General section */}
						<div style={{ marginBottom: '12px', paddingBottom: '12px' }} className="border-b border-gray-200 pb-6">
							<h2 className="text-2xl font-bold text-gray-900 mb-4">General</h2>

							<div>
								<label className="block text-sm font-medium text-gray-900 mb-2">Pet Name *</label>
								<input
									type="text"
									value={petName}
									onChange={(e) => setPetName(e.target.value)}
									placeholder="e.g., Milo, Luna, Buddy"
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
									required
								/>
							</div>
						</div>

						{error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full btn mt-4"
							>
								{loading ? 'Creating...' : 'Add Pet'}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);

	// searchAreaForVets removed — users manually enter vet address

	useEffect(() => {
		// Load breed lists depending on species. Cache results in localStorage.
		const storageKey = `petSitter:breeds:${species}`;

		const capitalizeWords = (s) =>
			s
				.split(' ')
				.map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
				.join(' ');

		const setList = (list) => {
			setBreedsList(list);
			try {
				localStorage.setItem(storageKey, JSON.stringify(list));
			} catch (err) {
				// ignore
			}
		};

		// If cached, use it
		try {
			const cached = localStorage.getItem(storageKey);
			if (cached) {
				setBreedsList(JSON.parse(cached));
				return;
			}
		} catch (err) {
			// ignore localStorage errors
		}

		if (species === 'dog') {
			fetch('https://dog.ceo/api/breeds/list/all')
				.then((res) => res.json())
				.then((data) => {
					if (data && data.message) {
						const breeds = Object.entries(data.message)
							.flatMap(([b, subs]) => {
								if (Array.isArray(subs) && subs.length) {
									return subs.map((sub) => capitalizeWords(`${sub} ${b}`));
								}
								return capitalizeWords(b);
							})
							.sort((a, z) => a.localeCompare(z));
						setList(breeds);
					}
				})
				.catch((err) => console.warn('Failed to load dog breeds list', err));
			return;
		}

		if (species === 'cat') {
			fetch('https://api.thecatapi.com/v1/breeds')
				.then((res) => res.json())
				.then((data) => {
					if (Array.isArray(data)) {
						const breeds = data.map((b) => capitalizeWords(b.name)).sort((a, z) => a.localeCompare(z));
						setList(breeds);
					}
				})
				.catch((err) => console.warn('Failed to load cat breeds list', err));
			return;
		}

		if (species === 'bird') {
			// small curated bird list
			const birds = [
				'Budgerigar',
				'Cockatiel',
				'Cockatoo',
				'Macaw',
				'Conure',
				'Lovebird',
				'Finch',
				'Canary',
				'African Grey',
				'Parakeet',
			];
			setList(birds.sort((a, z) => a.localeCompare(z)));
			return;
		}

		// default: clear list for unsupported species
		setBreedsList([]);
	}, [species]);

	const updateBreedInput = (value) => {
	 	setBreed(value);
	 	setFocusedSuggestion(-1);
	 	if (!value) {
	 		setBreedSuggestions([]);
	 		setShowBreedSuggestions(false);
	 		return;
	 	}
	 	const q = value.toLowerCase();
	 	const matches = breedsList.filter((b) => b.toLowerCase().includes(q)).slice(0, 8);
	 	setBreedSuggestions(matches);
	 	setShowBreedSuggestions(matches.length > 0);
	};

	const handleBreedKeyDown = (e) => {
	 	if (!showBreedSuggestions || breedSuggestions.length === 0) return;

	 	if (e.key === 'ArrowDown') {
	 		e.preventDefault();
	 		setFocusedSuggestion((prev) => {
	 			const next = Math.min(prev + 1, breedSuggestions.length - 1);
	 			const el = document.getElementById(`breed-suggestion-${next}`);
	 			if (el) el.scrollIntoView({ block: 'nearest' });
	 			return next;
	 		});
	 	} else if (e.key === 'ArrowUp') {
	 		e.preventDefault();
	 		setFocusedSuggestion((prev) => {
	 			const next = Math.max(prev - 1, 0);
	 			const el = document.getElementById(`breed-suggestion-${next}`);
	 			if (el) el.scrollIntoView({ block: 'nearest' });
	 			return next;
	 		});
	 	} else if (e.key === 'Enter') {
	 		if (focusedSuggestion >= 0 && focusedSuggestion < breedSuggestions.length) {
	 			e.preventDefault();
	 			chooseBreed(breedSuggestions[focusedSuggestion]);
	 		}
	 	} else if (e.key === 'Escape') {
	 		setShowBreedSuggestions(false);
	 		setFocusedSuggestion(-1);
	 	}
	};

	const chooseBreed = (b) => {
		setBreed(b);
		setBreedSuggestions([]);
		setShowBreedSuggestions(false);
		// focus next field (age)
		const el = document.querySelector('input[name="age"]');
		if (el) el.focus();
	};

	// Places/mapbox functionality removed. Users enter address manually.

	if (!activeHousehold) {
	   return (
		   <div className="min-h-screen bg-white flex items-center justify-center">
			   <div className="text-center">
				   <p className="text-red-500 mb-4">No household found</p>
				   <button
					   type="button"
					   onClick={() => navigate('/dashboard')}
					   className="btn"
				   >
					   Go back
				   </button>
			   </div>
		   </div>
	   );
	}

	       return (
		       <div className="min-h-screen bg-white">
			       <main className="flex justify-center py-8">
				       <div className="max-w-6xl px-6 mt-4 w-full">
					       <div className="mb-6">
						       <h1 className="text-3xl font-bold text-gray-900">Add a Pet</h1>
					       </div>

					       <form onSubmit={handleSubmit} className="space-y-6">
						       {/* General section */}
						       <div style={{ marginBottom: '12px', paddingBottom: '12px' }} className="border-b border-gray-200 pb-6">
							       <h2 className="text-2xl font-bold text-gray-900 mb-4">General</h2>

							       <div>
								       <label className="block text-sm font-medium text-gray-900 mb-2">Pet Name *</label>
								       <input
									       type="text"
									       value={petName}
									onChange={(e) => setPetName(e.target.value)}
									placeholder="e.g., Milo, Luna, Buddy"
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
									required
								/>
							</div>

							<div className="mt-4 relative">
								<label className="block text-sm font-medium text-gray-900 mb-2">Breed *</label>
								<input
									type="text"
								ref={breedInputRef}
								value={breed}
								onChange={(e) => updateBreedInput(e.target.value)}
								onKeyDown={handleBreedKeyDown}
								onFocus={() => {
									if (breedsList.length && breed) updateBreedInput(breed);
									else if (breedsList.length && !breed) {
										setBreedSuggestions(breedsList.slice(0, 8));
										setShowBreedSuggestions(true);
									}
								}}
								onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 150)}
								placeholder="Start typing to find your breed..."
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
									required
								/>
								{showBreedSuggestions && breedsList.length > 0 && (
									<ul
										role="listbox"
										aria-label="Breed suggestions"
										className="absolute left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-gray-200 rounded shadow z-50"
										ref={suggestionsRef}
									>
										{breedSuggestions.map((b, i) => {
											const isFocused = i === focusedSuggestion;
											return (
												<li
													id={`breed-suggestion-${i}`}
													key={b}
													role="option"
													aria-selected={isFocused}
													className={`px-3 py-2 cursor-pointer text-sm ${isFocused ? 'btn' : 'hover:bg-gray-100'}`}
													onMouseDown={(ev) => {
													// use onMouseDown to avoid losing focus before click
													ev.preventDefault();
													chooseBreed(b);
													}}
													>
													{b}
												</li>
											);
										})}
									</ul>
								)}
							</div>

							<div className="grid grid-cols-2 gap-3 mt-4">
								<div>
									<label className="block text-sm font-medium text-gray-900 mb-2">Age *</label>
									<input name="age"
										type="number"
										value={age}
										onChange={(e) => setAge(e.target.value)}
										placeholder="Years"
										min="0"
										max="100"
										className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
										required
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-gray-900 mb-2">Weight *</label>
									<div className="flex items-center gap-3">
										<input
											type="number"
											value={weight}
											onChange={(e) => setWeight(e.target.value)}
											placeholder="Amount"
											min="0"
											step="0.1"
											className="flex-1 px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
											required
										/>
										<select
											value={weightUnit}
											onChange={(e) => setWeightUnit(e.target.value)}
											className="w-28 px-3 py-2 rounded-none border border-gray-200 bg-white focus:border-accent focus:outline-none"
										>
											<option value="lbs">Lbs</option>
											<option value="kg">Kg</option>
										</select>
									</div>
								</div>
							</div>
						</div>

						{/* Vet Information */}
						<div style={{ marginBottom: '12px', paddingBottom: '12px' }} className="border-b border-gray-200 pt-4">
							<h2 className="text-2xl font-bold text-gray-900 mb-6">Vet Information</h2>

							<div>
								<label className="block text-sm font-medium text-gray-900 mb-2">Vet Location (optional)</label>
								<input
									type="text"
									value={vetLocation}
									onChange={(e) => setVetLocation(e.target.value)}
									placeholder="Address, clinic name, or postcode"
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
								/>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-900 mb-2">Vet Name (optional)</label>
								<input
									type="text"
									value={vetName}
									onChange={(e) => setVetName(e.target.value)}
									placeholder="e.g., Dr. Smith or Happy Paws Vet"
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
								/>
							</div>

							<div className="mt-3">
								<label className="block text-sm font-medium text-gray-900 mb-2">Vet Contact (optional)</label>
								<input
									type="tel"
									value={vetContact}
									onChange={(e) => setVetContact(e.target.value)}
									placeholder="Phone number"
									className="w-full px-4 py-2 rounded-none border border-gray-200 focus:border-accent focus:outline-none"
								/>
							</div>
						</div>



						{error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</div>}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="w-full btn mt-4"
							>
								{loading ? 'Creating...' : 'Add Pet'}
							</button>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}

