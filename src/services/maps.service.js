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
    const coreLoaded = typeof window.google !== 'undefined' && window.google.maps;
    
    if (!coreLoaded) {
      return false;
    }
    
    // Check for required APIs but don't block if they're missing
    // as we can fallback in many cases
    if (!window.google.maps.places) {
      console.warn('⚠️ Google Maps Places API not loaded');
    }
    
    // Explicitly check for marker library
    if (!window.google.maps.marker) {
      console.warn('⚠️ Google Maps marker library not loaded - advanced markers will not be available');
    }
    
    return true;
  }

  // Initialize map in the provided HTML element
  initMap(mapElement) {
    if (!this.isApiLoaded()) {
      console.error('❌ Google Maps API not loaded');
      return false;
    }

    try {
      // Log available libraries for debugging
      console.info('Google Maps libraries available at initialization:', {
        core: Boolean(window.google?.maps?.Map),
        places: Boolean(window.google?.maps?.places),
        marker: Boolean(window.google?.maps?.marker),
        advancedMarker: Boolean(window.google?.maps?.marker?.AdvancedMarkerElement),
        version: window.google?.maps?.version
      });
      
      // Create the map instance with Map ID for Advanced Markers support
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
        fullscreenControl: true,
        mapId: googleMapsConfig.mapId // Map ID required for Advanced Markers
      });

      // Initialize geocoder
      this.geocoder = new window.google.maps.Geocoder();
      
      // Places API - Using the recommended approach over PlacesService
      if (window.google.maps.places) {
        console.log('✅ Places API available');
      } else {
        console.warn('⚠️ Places API not available - search functionality will be limited');
      }
      
      // Verify marker library availability
      if (!window.google?.maps?.marker) {
        console.warn('⚠️ Marker library not available - will use legacy markers');
      } else {
        console.log('✅ Marker library available');
        
        if (!window.google?.maps?.marker?.AdvancedMarkerElement) {
          console.warn('⚠️ AdvancedMarkerElement not available - will use legacy markers');
        } else {
          console.log('✅ AdvancedMarkerElement available');
        }
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
    const position = { lat, lng };
    
    try {
      // Check if marker library and AdvancedMarkerElement are available
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        console.log('Creating temporary AdvancedMarkerElement');
        
        // Create a Pin element for better styling (red pin for temporary markers)
        let pinElement;
        if (window.google?.maps?.marker?.PinElement) {
          pinElement = new window.google.maps.marker.PinElement({
            background: '#FF4136', // Red color for temporary marker
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
            scale: 1.3
          });
        }
        
        this.tempMarker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          map: this.map,
          title: 'Selected Location',
          content: pinElement ? pinElement.element : undefined
        });
        
        // Store position reference separately for AdvancedMarkerElement
        // This helps with methods that expect getPosition()
        this.tempMarker._position = position;
        
        console.log('Successfully created temporary AdvancedMarkerElement');
      } else {
        throw new Error('AdvancedMarkerElement constructor not available');
      }
    } catch (error) {
      // Fallback to legacy Marker if AdvancedMarkerElement fails
      console.warn('Falling back to legacy Marker for temporary marker:', error.message);
      
      try {
        if (!window.google?.maps?.Marker) {
          console.error('Neither AdvancedMarkerElement nor standard Marker is available');
          return null;
        }
        
        this.tempMarker = new window.google.maps.Marker({
          position,
          map: this.map,
          animation: window.google.maps.Animation.DROP,
          title: 'Selected Location'
        });
        console.log('Successfully created temporary legacy Marker');
      } catch (markerError) {
        console.error('Failed to create temporary marker:', markerError);
        return null;
      }
    }
    
    // Add a custom getPosition method to AdvancedMarkerElement if needed
    if (this.tempMarker && !this.tempMarker.getPosition && this.tempMarker.position) {
      this.tempMarker.getPosition = function() {
        return this.position;
      };
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
    const position = { lat: location.lat, lng: location.lng };
    
    try {
      // More detailed debug logging
      console.debug('Google Maps API State:', {
        mapsLoaded: !!window.google?.maps,
        markerLibrary: !!window.google?.maps?.marker,
        advancedMarker: typeof window.google?.maps?.marker?.AdvancedMarkerElement === 'function',
        pinElement: typeof window.google?.maps?.marker?.PinElement === 'function',
        standardMarker: typeof window.google?.maps?.Marker === 'function'
      });
      
      // Check if marker library is properly loaded
      if (!window.google?.maps?.marker) {
        console.warn('Marker library not loaded. Available Google Maps objects:', 
          window.google?.maps ? Object.keys(window.google.maps) : 'None');
      }
      
      // Check if AdvancedMarkerElement is available with proper path
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        console.log('Creating AdvancedMarkerElement...');
        
        // Create a Pin element for better styling
        let pinElement;
        if (window.google?.maps?.marker?.PinElement) {
          pinElement = new window.google.maps.marker.PinElement({
            background: '#4285F4', // Google blue color
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
            scale: 1.3 // Slightly larger than default
          });
        }
        
        // Use the recommended AdvancedMarkerElement
        marker = new window.google.maps.marker.AdvancedMarkerElement({
          position,
          map: this.map,
          title: location.name || 'Location',
          content: pinElement ? pinElement.element : undefined
        });
        
        // Add custom getPosition method for compatibility with legacy code expecting it
        marker.getPosition = function() {
          return this.position;
        };
        
        console.log('Successfully created AdvancedMarkerElement');
      } else {
        throw new Error('AdvancedMarkerElement constructor not available');
      }
    } catch (error) {
      // Fallback to legacy Marker if AdvancedMarkerElement fails
      console.warn('Falling back to legacy Marker:', error.message);
      
      try {
        if (!window.google?.maps?.Marker) {
          console.error('Neither AdvancedMarkerElement nor standard Marker is available');
          return null;
        }
        
        marker = new window.google.maps.Marker({
          position,
          map: this.map,
          title: location.name || 'Location',
          animation: window.google.maps.Animation.DROP
        });
        console.log('Successfully created legacy Marker');
      } catch (markerError) {
        console.error('Failed to create any marker:', markerError);
        return null;
      }
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
      try {
        // Handle both AdvancedMarkerElement and legacy Marker differently
        if (marker instanceof window.google.maps.marker?.AdvancedMarkerElement) {
          // For AdvancedMarkerElement, use position property
          if (marker.position) {
            bounds.extend(marker.position);
          }
        } else if (marker instanceof window.google.maps.Marker) {
          // For legacy Marker, use getPosition() method
          bounds.extend(marker.getPosition());
        } else {
          // For unknown marker type, try to find position
          const position = marker.position || (marker.getPosition && marker.getPosition());
          if (position) {
            bounds.extend(position);
          } else {
            console.warn('Could not determine marker position', marker);
          }
        }
      } catch (error) {
        console.warn('Error processing marker in showAllMarkers:', error);
      }
    });
    
    if (bounds.isEmpty()) {
      console.warn('No valid marker positions found to create bounds');
      return false;
    }
    
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
