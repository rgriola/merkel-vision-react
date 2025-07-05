# Places API Integration in Merkel-Vision-React

This document provides an overview of how Google Places API is integrated into the Merkel-Vision-React project.

## API Configuration

The application uses the latest stable Google Places API with `PlaceAutocompleteElement` for address search functionality. This integration is configured in the following files:

### 1. `src/config/maps.config.js`

Contains the API key and Places API configuration:

```javascript
places: {
  componentRestrictions: { country: 'us' }, // Restrict results to a specific country
  types: ['geocode'], // Types of place results to return
  fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents'] 
}
```

### 2. `src/hooks/useGoogleMaps.js`

Loads the Google Maps API with Places library:

```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsConfig.apiKey}&libraries=places&loading=async`;
```

### 3. `src/services/maps.service.js`

Implements the PlaceAutocompleteElement integration:

```javascript
const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
  locationBias: this.map ? this.map.getBounds() : null,
  componentRestrictions: googleMapsConfig.places.componentRestrictions,
  types: googleMapsConfig.places.types
});
```

### 4. `src/components/PlaceSearchComponent.js`

Provides the React component that renders and manages the search functionality.

## How It Works

1. The `useGoogleMaps` hook loads the Google Maps API with the Places library.
2. The `PlaceSearchComponent` initializes the search functionality when the maps API is ready.
3. The `maps.service.js` creates a `PlaceAutocompleteElement` and attaches it to the DOM.
4. When a user selects a place, the `gmp-placeselect` event is triggered, and the application:
   - Fetches additional place details using `fetchFields()`
   - Centers the map on the selected location
   - Adds a temporary marker
   - Extracts address components
   - Notifies the parent component via the `onPlaceSelected` callback

## Troubleshooting

If the Places API is not working:

1. Ensure the Places API is enabled in the Google Cloud Console: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Check API key restrictions (allowed referrers/domains)
3. Verify billing is properly set up for your Google Cloud project
4. Check browser console for specific error messages

## API Reference

- [Places API Documentation](https://developers.google.com/maps/documentation/javascript/places)
- [PlaceAutocompleteElement Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
