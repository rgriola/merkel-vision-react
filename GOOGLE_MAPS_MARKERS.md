# Google Maps Marker API Guide

## Overview of Marker Options in Google Maps JavaScript API

As of July 2025, Google Maps JavaScript API offers two ways to create markers on a map:

1. **Legacy Markers** (`google.maps.Marker`) - Being deprecated but still supported
2. **Advanced Markers** (`google.maps.marker.AdvancedMarkerElement`) - Recommended modern approach

## AdvancedMarkerElement

### Benefits

- Better accessibility
- More customization options
- Better performance with large numbers of markers
- Built with web components technology
- Support for custom DOM content
- Improved drag and drop

### Requirements

To use `AdvancedMarkerElement`, you need:

1. **Marker Library**: Must explicitly request the marker library when loading the Maps JavaScript API
   ```javascript
   // Include 'marker' in the libraries parameter
   // Use v=beta to ensure access to latest features
   script.src = "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,marker&v=beta";
   ```

2. **Browser Support**: Modern browser with Web Components support

### Usage Example

```javascript
// Create a position
const position = { lat: 37.4220, lng: -122.0841 };

// Create a marker with advanced styling
const pinElement = new google.maps.marker.PinElement({
  background: "#4285F4",
  borderColor: "#FFFFFF",
  glyphColor: "#FFFFFF",
  scale: 1.3
});

// Create the advanced marker
const marker = new google.maps.marker.AdvancedMarkerElement({
  position,
  map: map,
  title: "Google HQ",
  content: pinElement.element
});
```

## Fallback to Legacy Markers

In our application, we implement fallback detection to ensure markers work across all environments:

```javascript
try {
  // Try to create an advanced marker if available
  if (window.google?.maps?.marker?.AdvancedMarkerElement) {
    marker = new window.google.maps.marker.AdvancedMarkerElement({/*...*/});
  } else {
    throw new Error('AdvancedMarkerElement not available');
  }
} catch (error) {
  // Fall back to legacy marker if needed
  console.warn('Falling back to legacy Marker:', error.message);
  marker = new window.google.maps.Marker({/*...*/});
}
```

## Common Issues and Solutions

### "AdvancedMarkerElement not available"

**Causes**:
- Marker library not loaded in the API request
- Using an older version of Google Maps JavaScript API
- Browser compatibility issues

**Solutions**:
1. Ensure you include `libraries=marker` in the API request
2. Use `v=beta` parameter in the API URL
3. Check browser compatibility
4. Verify the API key has access to the Marker library

### "google.maps.Marker is deprecated"

This warning is normal and expected. Google is moving toward `AdvancedMarkerElement` but still supports the legacy marker. Our application uses it as a fallback to ensure compatibility.

## References

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Advanced Markers Documentation](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [Migration Guide](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration)
