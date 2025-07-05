// Google Maps API configuration
export const googleMapsConfig = {
  apiKey: "AIzaSyCHQECnK2DXcNXIQR0ZfvIEPrAJWIH8JsM",
  mapId: "8e0a97af9386fef", // Map ID required for Advanced Markers
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
  // Note: When using mapId, styles should be configured in the Google Cloud Console
  // instead of here. These are only used when falling back to a map without mapId.
  mapStyles: []
};

// This uses the production Google Maps API key from the legacy Merkel-View project
