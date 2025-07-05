// Google Maps service for handling map operations
import { googleMapsConfig } from '../config/maps.config';

class MapsService {
  constructor() {
    this.map = null;
    this.geocoder = null;
    this.autocomplete = null;
    this.placesService = null;
    this.markers = new Map(); // For tracking markers by ID
    this.tempMarker = null; // For temporary markers during selection
    this.apiLoaded = false;
    this.mapReady = false;
    this.defaultLocation = googleMapsConfig.defaultCenter;
    this.defaultZoom = googleMapsConfig.defaultZoom;
    this.searchZoom = googleMapsConfig.searchZoom;
  }

  // Check if Google Maps API is loaded
  isApiLoaded() {
    return typeof window.google !== 'undefined' && window.google.maps;
  }

  // Initialize map in the provided HTML element
  initMap(mapElement) {
    if (!this.isApiLoaded()) {
      console.error('❌ Google Maps API not loaded');
      return false;
    }

    try {
      // Create the map instance
      this.map = new window.google.maps.Map(mapElement, {
        center: this.defaultLocation,
        zoom: this.defaultZoom,
        styles: googleMapsConfig.mapStyles,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      });

      // Initialize geocoder
      this.geocoder = new window.google.maps.Geocoder();
      
      // Places API - Using the recommended approach over PlacesService
      if (window.google.maps.places) {
        console.log('✅ Places API available');
        
        // We don't need to initialize PlacesService as we're using
        // Place.findPlaceFromQuery/findPlaceFromPhoneNumber/searchByText instead
      }
      
      // Set up map event listeners
      this.map.addListener('idle', () => {
        if (!this.mapReady) {
          console.log('✅ Map is fully initialized and ready');
          this.mapReady = true;
        }
      });

      // Set up click listener for adding new locations
      this.map.addListener('click', (event) => {
        if (this.onMapClick) {
          this.onMapClick(event.latLng.lat(), event.latLng.lng());
        }
      });

      console.log('✅ Map initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      return false;
    }
  }

  // Set a callback for map click events
  setMapClickHandler(callback) {
    this.onMapClick = callback;
  }

  // Center the map on a specific location
  centerMap(lat, lng, zoom = null) {
    if (!this.map) return false;
    
    this.map.setCenter({ lat, lng });
    if (zoom) this.map.setZoom(zoom);
    return true;
  }

  // Add a temporary marker for new location selection
  addTemporaryMarker(lat, lng) {
    if (!this.map) {
      console.log('Map not initialized yet, cannot add marker');
      return null;
    }
    
    // Remove any existing temporary marker
    if (this.tempMarker) {
      try {
        this.tempMarker.setMap(null);
      } catch (error) {
        console.warn('Error clearing previous marker:', error);
      }
    }
    
    // Create new marker - always try AdvancedMarkerElement first
    try {
      // Check if AdvancedMarkerElement is available properly
      if (window.google.maps.marker && typeof window.google.maps.marker.AdvancedMarkerElement === 'function') {
        const position = { lat, lng };
        this.tempMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          map: this.map,
          title: 'Selected Location'
        });
      } else {
        throw new Error('AdvancedMarkerElement constructor not available');
      }
    } catch (error) {
      // Fallback to legacy Marker if AdvancedMarkerElement fails
      console.warn('AdvancedMarkerElement not available, using legacy Marker:', error.message);
      this.tempMarker = new window.google.maps.Marker({
        position: { lat, lng },
        map: this.map,
        animation: window.google.maps.Animation.DROP,
        title: 'Selected Location'
      });
    }
    
    return this.tempMarker;
  }

  // Add a location marker to the map
  addLocationMarker(location) {
    if (!this.map) return null;
    if (!location.id) {
      console.error('❌ Location must have an ID');
      return null;
    }
    
    // Check if marker already exists for this location
    if (this.markers.has(location.id)) {
      // Update existing marker position if needed
      const marker = this.markers.get(location.id);
      marker.setPosition({ lat: location.lat, lng: location.lng });
      return marker;
    }
    
    // Create a new marker - always try to use AdvancedMarkerElement first
    let marker;
    
    try {
      // Check if AdvancedMarkerElement is available - with proper path
      if (window.google.maps.marker && typeof window.google.maps.marker.AdvancedMarkerElement === 'function') {
        // Create position object
        const position = { lat: location.lat, lng: location.lng };
        
        // Use the recommended AdvancedMarkerElement
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          map: this.map,
          title: location.name || 'Location'
        });
      } else {
        throw new Error('AdvancedMarkerElement not available');
      }
    } catch (error) {
      // Fallback to legacy Marker if AdvancedMarkerElement fails
      console.warn('AdvancedMarkerElement not available, using legacy Marker:', error.message);
      marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: this.map,
        title: location.name || 'Location',
        animation: window.google.maps.Animation.DROP
      });
    }
    
    // Add click listener
    marker.addListener('click', () => {
      if (this.onMarkerClick) {
        this.onMarkerClick(location);
      }
    });
    
    // Store marker reference
    this.markers.set(location.id, marker);
    return marker;
  }

  // Set a callback for marker click events
  setMarkerClickHandler(callback) {
    this.onMarkerClick = callback;
  }

  // Remove a location marker from the map
  removeLocationMarker(locationId) {
    if (this.markers.has(locationId)) {
      const marker = this.markers.get(locationId);
      marker.setMap(null);
      this.markers.delete(locationId);
      return true;
    }
    return false;
  }

  // Show all markers on the map and fit bounds
  showAllMarkers() {
    if (!this.map || this.markers.size === 0) return false;
    
    const bounds = new window.google.maps.LatLngBounds();
    this.markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    
    this.map.fitBounds(bounds);
    
    // If there's only one marker, zoom in
    if (this.markers.size === 1) {
      this.map.setZoom(this.searchZoom);
    }
    
    return true;
  }

  // Search for a place/address using the new Places API
  async searchPlace(address) {
    if (!this.geocoder) {
      console.error('❌ Geocoder not initialized');
      throw new Error('Geocoding service not available');
    }
    
    try {
      // Use the new Places API structure
      const geocodingRequest = {
        address,
        region: 'us'
      };
      
      const results = await this.geocoder.geocode(geocodingRequest);
      
      if (!results || !results.results || results.results.length === 0) {
        throw new Error('No results found');
      }
      
      const firstResult = results.results[0];
      const location = firstResult.geometry.location;
      const viewport = firstResult.geometry.viewport;
      
      // Center map on the found location
      if (viewport) {
        this.map.fitBounds(viewport);
      } else {
        this.centerMap(location.lat(), location.lng(), this.searchZoom);
      }
      
      // Add temporary marker
      this.addTemporaryMarker(location.lat(), location.lng());
      
      // Extract address components
      const addressComponents = {};
      firstResult.address_components.forEach(component => {
        if (component.types.includes('locality')) {
          addressComponents.city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          addressComponents.state = component.short_name;
        } else if (component.types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (component.types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });
      
      // Return location data
      return {
        lat: location.lat(),
        lng: location.lng(),
        address: firstResult.formatted_address,
        ...addressComponents
      };
    } catch (error) {
      console.error('❌ Place search error:', error);
      throw error;
    }
  }

  // Get location details from coordinates (reverse geocoding)
  async getLocationDetails(lat, lng) {
    if (!this.geocoder) {
      console.error('❌ Geocoder not initialized');
      throw new Error('Geocoding service not available');
    }
    
    try {
      // Use the new Places API structure for reverse geocoding
      const geocodingRequest = {
        location: { lat, lng }
      };
      
      const results = await this.geocoder.geocode(geocodingRequest);
      
      if (!results || !results.results || results.results.length === 0) {
        throw new Error('No results found');
      }
      
      const firstResult = results.results[0];
      
      // Extract address components
      const addressComponents = {};
      firstResult.address_components.forEach(component => {
        if (component.types.includes('locality')) {
          addressComponents.city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          addressComponents.state = component.short_name;
        } else if (component.types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (component.types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        }
      });
      
      // Return location data
      return {
        lat,
        lng,
        address: firstResult.formatted_address,
        ...addressComponents
      };
    } catch (error) {
      console.error('❌ Get location details error:', error);
      throw error;
    }
  }

  /**
   * Set up PlaceAutocompleteElement for address search using the latest stable Places API
   * @see https://developers.google.com/maps/documentation/javascript/place-autocomplete
   * @param {HTMLElement} containerElement - DOM element to attach the PlaceAutocompleteElement
   * @returns {Element|null} - The PlaceAutocompleteElement or null if setup failed
   */
  setupPlaceAutocomplete(containerElement) {
    // Check if Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      console.error('❌ Google Maps API not loaded');
      return null;
    }
    
    // Check if Places API is available
    if (!window.google.maps.places) {
      console.error('❌ Places library not loaded - please ensure libraries=places is in the API URL');
      return null;
    }
    
    // Check if PlaceAutocompleteElement is available
    if (typeof window.google.maps.places.PlaceAutocompleteElement !== 'function') {
      console.error('❌ PlaceAutocompleteElement not available - please ensure the Places API is enabled in your Google Cloud Console');
      console.log('Available Google Maps objects:', Object.keys(window.google.maps));
      console.log('Available Places objects:', window.google.maps.places ? Object.keys(window.google.maps.places) : 'None');
      return null;
    }
    
    try {
      console.log('Creating PlaceAutocompleteElement...');
      // Create the Place Autocomplete Element with the new Places API
      const placeAutocomplete = new window.google.maps.places.PlaceAutocompleteElement({
        // Don't make this dependent on the map being initialized
        locationBias: null,
        componentRestrictions: googleMapsConfig.places.componentRestrictions,
        types: googleMapsConfig.places.types
      });
      
      // Clear any existing content and append the place autocomplete element
      containerElement.innerHTML = '';
      containerElement.appendChild(placeAutocomplete);
      
      // Add event listener for place selection
      placeAutocomplete.addEventListener('gmp-placeselect', async (event) => {
        const place = event.place;
        
        try {
          // Fetch all the required fields
          await place.fetchFields({
            fields: googleMapsConfig.places.fields
          });
          
          if (!place.location) {
            throw new Error('Selected place has no location data');
          }
          
          // Center map and add marker if map is initialized
          const lat = place.location.lat;
          const lng = place.location.lng;
          
          if (this.map) {
            console.log('Map available, centering on selected place');
            if (place.viewport) {
              this.map.fitBounds(place.viewport);
            } else {
              this.centerMap(lat, lng, this.searchZoom);
            }
            
            // Add temporary marker
            this.addTemporaryMarker(lat, lng);
          } else {
            console.log('Map not yet initialized, storing location data only');
          }
          this.addTemporaryMarker(lat, lng);
          
          // Extract address components
          const addressComponents = {};
          if (place.addressComponents) {
            place.addressComponents.forEach(component => {
              if (component.types.includes('locality')) {
                addressComponents.city = component.longText;
              } else if (component.types.includes('administrative_area_level_1')) {
                addressComponents.state = component.shortText;
              } else if (component.types.includes('country')) {
                addressComponents.country = component.longText;
              } else if (component.types.includes('postal_code')) {
                addressComponents.postalCode = component.longText;
              }
            });
          }
          
          // Return the found place data
          const placeData = {
            lat,
            lng,
            address: place.formattedAddress || place.displayName,
            name: place.displayName,
            ...addressComponents
          };
          
          // If there's a callback registered, call it
          if (this.onPlaceSelected) {
            this.onPlaceSelected(placeData);
          }
          
          return placeData;
        } catch (error) {
          console.error('❌ Error processing selected place:', error);
          throw error;
        }
      });
      
      console.log('✅ PlaceAutocompleteElement initialized successfully');
      return placeAutocomplete;
    } catch (error) {
      console.error('❌ Error setting up PlaceAutocompleteElement:', error);
      
      // Add diagnostic information for troubleshooting
      console.error('📌 Places API Troubleshooting Guide:');
      console.error('1. Ensure the Places API is enabled in Google Cloud Console: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
      console.error('2. Check API key restrictions (allowed referrers/domains)');
      console.error('3. Verify billing is properly set up for your Google Cloud project');
      console.error('4. Make sure your browser supports the latest Places API');
      
      return null;
    }
  }

  // Set a callback for place selection events
  setPlaceSelectedHandler(callback) {
    this.onPlaceSelected = callback;
  }
}

// Create and export a singleton instance
const mapsService = new MapsService();
export default mapsService;
