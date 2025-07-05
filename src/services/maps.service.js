// Google Maps service for handling map operations
import { googleMapsConfig } from '../config/maps.config';

class MapsService {
  constructor() {
    this.map = null;
    this.geocoder = null;
    this.autocomplete = null;
    this.placesService = null;
    this.markers = new Map(); // For tracking markers
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
      
      // Create the map options object
      const mapOptions = {
        center: this.defaultLocation,
        zoom: this.defaultZoom,
        mapTypeId: 'roadmap',
        gestureHandling: 'greedy',
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true
      };
      
      // If mapId is available, use it for Advanced Markers support
      // Note: styles cannot be used together with mapId (controlled via cloud console instead)
      if (googleMapsConfig.mapId) {
        mapOptions.mapId = googleMapsConfig.mapId;
      } else {
        // Only apply styles when no mapId is present
        mapOptions.styles = googleMapsConfig.mapStyles;
      }
      
      // Create the map instance
      this.map = new window.google.maps.Map(mapElement, mapOptions);

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
    console.log('🎯 centerMap called with:', { 
      lat, 
      lng, 
      zoom,
      latType: typeof lat, 
      lngType: typeof lng,
      mapInitialized: !!this.map,
      mapReady: this.mapReady
    });
    
    if (!this.map) {
      console.error('❌ Cannot center map - map not initialized');
      return false;
    }
    
    // Ensure we have valid coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      console.warn('⚠️ Non-numeric coordinates received, attempting to convert');
      
      // Try to convert to numbers if they're strings
      const numLat = parseFloat(lat);
      const numLng = parseFloat(lng);
      
      if (isNaN(numLat) || isNaN(numLng)) {
        console.error('❌ Invalid coordinates for centerMap - cannot convert to numbers:', { lat, lng });
        return false;
      }
      
      lat = numLat;
      lng = numLng;
      console.log('✅ Successfully converted coordinates to numbers:', { lat, lng });
    }
    
    // Check for out-of-range coordinates
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('❌ Coordinates out of valid range:', { lat, lng });
      return false;
    }
    
    console.log('🎯 Centering map to coordinates:', { lat, lng, zoom });
    
    try {
      // Create the position object
      const position = { lat, lng };
      
      // Set center first
      this.map.setCenter(position);
      console.log('✅ Map center set successfully');
      
      // Set zoom if specified
      if (zoom !== null && zoom !== undefined) {
        this.map.setZoom(zoom);
        console.log('✅ Map zoom set to:', zoom);
      }
      
      // Remove any existing temporary marker first
      if (this.tempMarker) {
        try {
          this.tempMarker.setMap(null);
          this.tempMarker = null;
          console.log('✅ Previous temporary marker removed');
        } catch (error) {
          console.warn('⚠️ Error removing previous temporary marker:', error);
        }
      }
      
      // Add a temporary highlight marker to show where we centered
      console.log('📍 Adding temporary marker at centered location');
      const markerResult = this.addTemporaryMarker(lat, lng);
      
      if (markerResult) {
        console.log('✅ Map successfully centered and temporary marker added');
        return true;
      } else {
        console.warn('⚠️ Map centered but temporary marker failed to add');
        return true; // Still consider it a success since the main operation worked
      }
    } catch (error) {
      console.error('❌ Error centering map:', error);
      return false;
    }
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
          content: pinElement ? pinElement.element : undefined,
          zIndex: 1000, // Higher z-index than regular markers
          collisionBehavior: window.google.maps.CollisionBehavior?.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });
        
        // Store position reference separately for AdvancedMarkerElement
        // This helps with methods that expect getPosition()
        this.tempMarker._position = position;
        
        console.log('Successfully created temporary AdvancedMarkerElement at:', position);
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
          title: 'Selected Location',
          zIndex: 1000, // Higher z-index than regular markers
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#FF4136',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2
          }
        });
        console.log('Successfully created temporary legacy Marker with custom icon at:', position);
      } catch (markerError) {
        console.error('Failed to create temporary marker:', markerError);
        return null;
      }
    }
    
    // Add compatibility methods to AdvancedMarkerElement if needed
    if (this.tempMarker && this.tempMarker.position) {
      // Add getPosition method for compatibility
      if (!this.tempMarker.getPosition) {
        this.tempMarker.getPosition = function() {
          return this.position;
        };
      }
      
      // Add setPosition method for compatibility
      if (!this.tempMarker.setPosition) {
        this.tempMarker.setPosition = function(newPosition) {
          this.position = newPosition;
        };
      }
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
      const newPosition = { lat: location.lat, lng: location.lng };
      
      try {
        // Different update methods depending on marker type
        if (marker instanceof window.google.maps.marker?.AdvancedMarkerElement) {
          // For AdvancedMarkerElement, set the position property directly
          marker.position = newPosition;
          console.log('Updated AdvancedMarkerElement position');
        } else if (marker instanceof window.google.maps.Marker) {
          // For legacy Marker, use the setPosition method
          marker.setPosition(newPosition);
          console.log('Updated legacy Marker position');
        } else {
          // Try both approaches if type detection fails
          if (typeof marker.setPosition === 'function') {
            marker.setPosition(newPosition);
          } else if (marker.position !== undefined) {
            marker.position = newPosition;
          } else {
            console.warn('Unable to update marker position - unknown marker type');
          }
        }
      } catch (error) {
        console.error('Error updating marker position:', error);
      }
      
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
          content: pinElement ? pinElement.element : undefined,
          zIndex: 999, // Ensure marker appears above other elements
          collisionBehavior: window.google.maps.CollisionBehavior?.OPTIONAL_AND_HIDES_LOWER_PRIORITY
        });
        
        // Add compatibility methods for AdvancedMarkerElement to work with legacy code
        marker.getPosition = function() {
          return this.position;
        };
        
        marker.setPosition = function(newPosition) {
          this.position = newPosition;
        };
        
        // Store position in _position property for additional compatibility
        marker._position = position;
        
        console.log('Successfully created AdvancedMarkerElement with compatibility methods at position:', position);
        console.log('Marker visibility check:', {
          map: !!marker.map,
          position: marker.position,
          content: !!marker.content,
          zIndex: marker.zIndex
        });
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
          animation: window.google.maps.Animation.DROP,
          zIndex: 999, // Ensure marker appears above other elements
          optimized: false // Disable optimization for better visibility
        });
        console.log('Successfully created legacy Marker at position:', position);
        console.log('Legacy marker visibility check:', {
          map: !!marker.map,
          position: marker.getPosition(),
          zIndex: marker.zIndex,
          visible: marker.getVisible()
        });
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
    if (!this.map) {
      console.warn('Cannot show all markers - map not initialized');
      return false;
    }
    
    if (this.markers.size === 0) {
      console.warn('No markers to show on map');
      return false;
    }
    
    console.log(`Showing all markers (${this.markers.size} total)`);
    
    // Debug log of all markers before processing
    console.log('Markers before processing:', 
      Array.from(this.markers.entries()).map(([id, marker]) => ({
        id, 
        type: marker instanceof window.google.maps.marker?.AdvancedMarkerElement ? 'AdvancedMarkerElement' : 
              marker instanceof window.google.maps.Marker ? 'LegacyMarker' : 'Unknown',
        hasPosition: !!marker.position,
        hasGetPosition: typeof marker.getPosition === 'function'
      }))
    );
    
    const bounds = new window.google.maps.LatLngBounds();
    let validPositionsFound = 0;
    
    this.markers.forEach((marker, id) => {
      try {
        // Handle both AdvancedMarkerElement and legacy Marker differently
        if (marker instanceof window.google.maps.marker?.AdvancedMarkerElement) {
          // For AdvancedMarkerElement, use position property
          if (marker.position) {
            bounds.extend(marker.position);
            validPositionsFound++;
            console.log(`Added AdvancedMarkerElement position for ID ${id}:`, marker.position);
          } else {
            console.warn(`AdvancedMarkerElement for ID ${id} has no position property`);
          }
        } else if (marker instanceof window.google.maps.Marker) {
          // For legacy Marker, use getPosition() method
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position);
            validPositionsFound++;
            console.log(`Added legacy Marker position for ID ${id}:`, position.toJSON());
          } else {
            console.warn(`Legacy Marker for ID ${id} returned null from getPosition()`);
          }
        } else {
          // For unknown marker type, try to find position
          let position = null;
          
          // Try all possible ways to get position
          if (marker.position) {
            position = marker.position;
            console.log(`Using position property for marker ID ${id}`);
          } else if (typeof marker.getPosition === 'function') {
            position = marker.getPosition();
            console.log(`Using getPosition() method for marker ID ${id}`);
          }
          
          if (position) {
            // Ensure position has lat and lng properties or methods
            let lat = null;
            let lng = null;
            
            if (typeof position.lat === 'function') {
              lat = position.lat();
            } else if (typeof position.lat === 'number') {
              lat = position.lat;
            }
            
            if (typeof position.lng === 'function') {
              lng = position.lng();
            } else if (typeof position.lng === 'number') {
              lng = position.lng;
            }
            
            if (lat !== null && lng !== null) {
              bounds.extend({ lat, lng });
              validPositionsFound++;
              console.log(`Added unknown marker type position for ID ${id}:`, { lat, lng });
            } else {
              console.warn(`Position for ID ${id} has invalid lat/lng values:`, position);
            }
          } else {
            console.warn(`Could not determine marker position for ID ${id}`, marker);
          }
        }
      } catch (error) {
        console.warn(`Error processing marker ${id} in showAllMarkers:`, error);
      }
    });
    
    if (validPositionsFound === 0 || bounds.isEmpty()) {
      console.warn('No valid marker positions found to create bounds');
      return false;
    }
    
    console.log(`Fitting map to bounds with ${validPositionsFound} valid positions`);
    
    try {
      this.map.fitBounds(bounds);
      
      // If there's only one marker, zoom in
      if (validPositionsFound === 1) {
        this.map.setZoom(this.searchZoom);
        console.log(`Only one marker found, setting zoom to ${this.searchZoom}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error applying bounds to map:', error);
      return false;
    }
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
    // Check if container element is valid
    if (!containerElement) {
      console.error('❌ No container element provided for PlaceAutocomplete');
      return null;
    }
    
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
      
      // Safely clear and append the place autocomplete element
      // First check if the container element is still in the DOM
      if (document.body.contains(containerElement)) {
        // Clear any existing content and append the place autocomplete element
        containerElement.innerHTML = '';
        containerElement.appendChild(placeAutocomplete);
      } else {
        console.warn('Container element is no longer in the DOM, cannot append PlaceAutocomplete');
        return null;
      }
      
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
          
          console.log('Place selected:', { lat, lng, name: place.displayName });
          
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
