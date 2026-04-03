import { useState } from 'react';
import Tesseract from 'tesseract.js';

const pinRegex = /\b\d{6}\b/;

export default function LensMode({ onPinDetected, onAddressDetected }) {
  const [ocrText, setOcrText] = useState('');
  const [loading, setLoading] = useState(false);

  const processImage = async (file) => {
    if (!file) return;
    setLoading(true);
    const {
      data: { text }
    } = await Tesseract.recognize(file, 'eng');

    setOcrText(text);
    const pin = text.match(pinRegex)?.[0];

    if (pin) onPinDetected(pin);

    const cleanedAddress = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');

    if (cleanedAddress) onAddressDetected(cleanedAddress);
    setLoading(false);
  };

  return (
    <section className="panel">
      <h2>Lens Mode (OCR)</h2>
      <input type="file" accept="image/*" capture="environment" onChange={(e) => processImage(e.target.files?.[0])} />
      {loading && <p>Extracting text...</p>}
      {ocrText && <pre>{ocrText}</pre>}
    </section>
  );
}
