export default function PostOfficeCard({ office, onFavorite, isFavorite, distanceKm }) {
  return (
    <article className="card">
      <div className="card-header">
        <h3>{office.name}</h3>
        <button onClick={() => onFavorite(office)}>{isFavorite ? '★' : '☆'}</button>
      </div>
      <p><strong>PIN:</strong> {office.pincode}</p>
      <p><strong>District:</strong> {office.district}</p>
      <p><strong>State:</strong> {office.state}</p>
      <p><strong>Branch Type:</strong> {office.branchType}</p>
      <p><strong>Delivery:</strong> {office.deliveryStatus}</p>
      {distanceKm != null && <p><strong>Distance:</strong> {distanceKm.toFixed(2)} km</p>}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.name}, ${office.pincode}`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Navigate
      </a>
    </article>
  );
}
