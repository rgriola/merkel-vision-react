// Google Maps API configuration
export const googleMapsConfig = {
  apiKey: "AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM",
  defaultCenter: { lat: 39.8283, lng: -98.5795 }, // Center of US
  defaultZoom: 4,
  searchZoom: 15,
  // Places API configuration using the stable PlaceAutocompleteElement API
  // Documentation: https://developers.google.com/maps/documentation/javascript/place-autocomplete
  places: {
    componentRestrictions: { country: 'us' }, // Restrict results to a specific country
    types: ['geocode'], // Types of place results to return
    fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'] // Fields to fetch for each place
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
