# India Post API Reference (Reusable)

Source: http://www.postalpincode.in/Api-Details

## Base URL

`https://api.postalpincode.in`

## Endpoints used

### 1) Search by PIN

`GET /pincode/{PINCODE}`

Example: `https://api.postalpincode.in/pincode/110001`

### 2) Search by Post Office Name

`GET /postoffice/{NAME}`

Example: `https://api.postalpincode.in/postoffice/Connaught%20Place`

## Common response fields

- Name
- Pincode
- District
- State
- BranchType
- DeliveryStatus
- Circle
- Region
- Division
- Country
- Latitude
- Longitude

## Notes

- Some records can contain duplicate post office names across districts/states.
- Not all records include geocoordinates; the app gracefully falls back when lat/long is missing.
