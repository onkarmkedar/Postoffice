import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0';
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please retry later.' }
});

app.use('/api', limiter);

const sanitizeName = (name = '') =>
  name
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');

const isValidPin = (pin) => /^\d{6}$/.test(pin);

const fetchIndiaPost = async (path) => {
  const url = `https://api.postalpincode.in${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`India Post API request failed with ${response.status}`);
  }

  return response.json();
};

const safeApiResponse = (payload) => {
  const list = payload?.[0]?.PostOffice || [];
  return list.map((item) => ({
    name: item.Name,
    pincode: item.Pincode,
    district: item.District,
    state: item.State,
    branchType: item.BranchType,
    deliveryStatus: item.DeliveryStatus,
    country: item.Country,
    circle: item.Circle,
    region: item.Region,
    division: item.Division,
    latitude: item.Latitude,
    longitude: item.Longitude
  }));
};

app.get('/api/health', (_, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/pincode/:pin', async (req, res) => {
  const { pin } = req.params;

  if (!isValidPin(pin)) {
    return res.status(400).json({ error: 'Invalid PIN code. Enter 6 digits.' });
  }

  const cacheKey = `pin:${pin}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json({ source: 'cache', data: cached });
  }

  try {
    const raw = await fetchIndiaPost(`/pincode/${pin}`);
    const data = safeApiResponse(raw);

    cache.set(cacheKey, data);
    return res.json({ source: 'live', data });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get('/api/postoffice/:name', async (req, res) => {
  const cleanName = sanitizeName(req.params.name);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'Enter at least 2 characters for post office name.' });
  }

  const cacheKey = `name:${cleanName.toLowerCase()}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return res.json({ source: 'cache', data: cached });
  }

  try {
    const raw = await fetchIndiaPost(`/postoffice/${encodeURIComponent(cleanName)}`);
    const data = safeApiResponse(raw);

    cache.set(cacheKey, data);
    return res.json({ source: 'live', data });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});

app.get('/api/geocode', async (req, res) => {
  const address = sanitizeName(req.query.address || '');
  if (!address) {
    return res.status(400).json({ error: 'Address is required.' });
  }

  const key = process.env.GEOCODING_API_KEY;
  if (!key) {
    return res.status(400).json({ error: 'GEOCODING_API_KEY is not configured.' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const response = await fetch(url);
    const payload = await response.json();

    if (payload.status !== 'OK' || !payload.results?.length) {
      return res.status(404).json({ error: 'No coordinates found for this address.' });
    }

    const { lat, lng } = payload.results[0].geometry.location;
    return res.json({ lat, lng, formattedAddress: payload.results[0].formatted_address });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
});


const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
});
