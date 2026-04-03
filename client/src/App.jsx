import { useMemo, useState } from 'react';
import Fuse from 'fuse.js';
import api from './services/api';
import { dictionary } from './data/i18n';
import { useLocalStorage } from './hooks/useLocalStorage';
import { haversineKm } from './utils/haversine';
import PostOfficeCard from './components/PostOfficeCard';
import PostOfficeMap from './components/PostOfficeMap';
import LensMode from './components/LensMode';

const debounce = (fn, delay = 350) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

function App() {
  const [language, setLanguage] = useState('en');
  const [nameInput, setNameInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [results, setResults] = useState([]);
  const [filters, setFilters] = useState({ state: '', district: '' });
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [favorites, setFavorites] = useLocalStorage('favorites', []);
  const [history, setHistory] = useLocalStorage('history', []);

  const t = dictionary[language];

  const searchByName = debounce(async (name) => {
    if (name.length < 2) {
      setResults([]);
      return;
    }

    try {
      setError('');
      const data = await api.getByPostoffice(name);
      setResults(data);
      setHistory((prev) => [
        { type: 'name', query: name, at: new Date().toISOString() },
        ...prev.slice(0, 9)
      ]);
    } catch (err) {
      setError(`${err.message} Did you mean a nearby spelling?`);
    }
  });

  const onPinSearch = async (pin = pinInput) => {
    if (!/^\d{6}$/.test(pin)) {
      setError('Invalid PIN code. Please enter 6 digits.');
      return;
    }

    try {
      setError('');
      const data = await api.getByPincode(pin);
      setResults(data);
      setHistory((prev) => [{ type: 'pin', query: pin, at: new Date().toISOString() }, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err.message);
    }
  };

  const onAddressSearch = async (value = addressInput) => {
    try {
      setError('');
      const coords = await api.geocode(value);
      setUserLocation({ lat: coords.lat, lng: coords.lng });

      const pinMatch = value.match(/\b\d{6}\b/);
      if (pinMatch) {
        const pinData = await api.getByPincode(pinMatch[0]);
        setResults(
          pinData
            .map((office) => ({
              ...office,
              distanceKm:
                office.latitude && office.longitude
                  ? haversineKm({ lat: coords.lat, lng: coords.lng }, { lat: Number(office.latitude), lng: Number(office.longitude) })
                  : null
            }))
            .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
        );
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const onNearMe = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);

        if (/^\d{6}$/.test(pinInput)) {
          const data = await api.getByPincode(pinInput);
          setResults(
            data
              .map((office) => ({
                ...office,
                distanceKm:
                  office.latitude && office.longitude
                    ? haversineKm(coords, { lat: Number(office.latitude), lng: Number(office.longitude) })
                    : null
              }))
              .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
          );
        }
      },
      () => setError('Unable to fetch location. Please allow GPS access.')
    );
  };

  const addFavorite = (office) => {
    setFavorites((prev) => {
      const exists = prev.some((item) => item.name === office.name && item.pincode === office.pincode);
      return exists ? prev.filter((item) => !(item.name === office.name && item.pincode === office.pincode)) : [office, ...prev];
    });
  };

  const filteredResults = useMemo(() => {
    const filtered = results.filter(
      (item) =>
        (!filters.state || item.state === filters.state) && (!filters.district || item.district === filters.district)
    );

    if (!nameInput) return filtered;

    const fuse = new Fuse(filtered, {
      keys: ['name'],
      threshold: 0.35
    });

    return fuse.search(nameInput).map((x) => x.item);
  }, [results, filters, nameInput]);

  const states = [...new Set(results.map((item) => item.state).filter(Boolean))];
  const districts = [...new Set(results.map((item) => item.district).filter(Boolean))];

  return (
    <main className="app">
      <header>
        <h1>{t.appTitle}</h1>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
      </header>

      <section className="panel">
        <h2>{t.searchByName}</h2>
        <input
          placeholder="Type post office name"
          value={nameInput}
          onChange={(e) => {
            const value = e.target.value;
            setNameInput(value);
            searchByName(value);
          }}
        />
        <div className="filters">
          <select value={filters.state} onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}>
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <select value={filters.district} onChange={(e) => setFilters((prev) => ({ ...prev, district: e.target.value }))}>
            <option value="">All Districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </div>
      </section>

      <section className="panel">
        <h2>{t.searchByPin}</h2>
        <input maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))} placeholder="6-digit PIN" />
        <button onClick={() => onPinSearch()}>Search PIN</button>
      </section>

      <LensMode onPinDetected={(pin) => { setPinInput(pin); onPinSearch(pin); }} onAddressDetected={(address) => setAddressInput(address)} />

      <section className="panel">
        <h2>{t.addressSearch}</h2>
        <input value={addressInput} onChange={(e) => setAddressInput(e.target.value)} placeholder="Enter full address" />
        <button onClick={() => onAddressSearch()}>Find nearest from address</button>
      </section>

      <section className="panel">
        <h2>{t.nearMe}</h2>
        <button onClick={onNearMe}>Use my GPS location</button>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="grid">
        {filteredResults.map((office) => (
          <PostOfficeCard
            key={`${office.name}-${office.pincode}-${office.branchType}`}
            office={office}
            onFavorite={addFavorite}
            isFavorite={favorites.some((f) => f.name === office.name && f.pincode === office.pincode)}
            distanceKm={office.distanceKm}
          />
        ))}
      </section>

      <PostOfficeMap offices={filteredResults} userLocation={userLocation} />

      <section className="panel">
        <h2>{t.favorites}</h2>
        <ul>{favorites.map((item) => <li key={`${item.name}-${item.pincode}`}>{item.name} ({item.pincode})</li>)}</ul>
      </section>

      <section className="panel">
        <h2>{t.history}</h2>
        <ul>{history.map((item, idx) => <li key={`${item.query}-${idx}`}>{item.type}: {item.query}</li>)}</ul>
      </section>
    </main>
  );
}

export default App;
