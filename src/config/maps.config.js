// Google Maps API configuration
export const googleMapsConfig = {
  apiKey: "AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM",
  defaultCenter: { lat: 39.8283, lng: -98.5795 }, // Center of US
  defaultZoom: 4,
  searchZoom: 15,
  // Places API configuration (using the new stable API, not legacy)
  places: {
    componentRestrictions: { country: 'us' },
    types: ['geocode'],
    fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents']
  },
  mapStyles: [
    // Add custom map styles here if needed
    // Example:
    // {
    //   featureType: "all",
    //   elementType: "geometry",
    //   stylers: [{ color: "#242f3e" }]
    // }
  ]
};

// This uses the production Google Maps API key from the legacy Merkel-View project
