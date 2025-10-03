"use client";

import { useEffect } from "react";

interface EditStudentClientProps {
  meetingLocation: string | null;
}

export default function EditStudentClient({ meetingLocation }: EditStudentClientProps) {
  useEffect(() => {
    // Add a small delay to ensure DOM elements are rendered
    const initializeForm = () => {
      const locationTypeSelect = document.getElementById('locationTypeSelect') as HTMLSelectElement;
      const locationDetails = document.getElementById('locationDetails') as HTMLDivElement;
      const platformDetails = document.getElementById('platformDetails') as HTMLDivElement;
      const locationInput = document.getElementById('location-input') as HTMLInputElement;
      const platformSelect = document.querySelector('[name="meetingPlatform"]') as HTMLSelectElement;

      if (!locationTypeSelect || !locationDetails || !platformDetails) {
        console.log('Form elements not found, retrying...');
        return false;
      }

      console.log('Form elements found, initializing...');

      // Function to toggle visibility based on selection
      function toggleLocationFields() {
        const selectedValue = locationTypeSelect.value;
        
        if (selectedValue === 'In-Person') {
          locationDetails.style.display = 'block';
          platformDetails.style.display = 'none';
          // Clear platform selection when switching to In-Person
          if (platformSelect) {
            platformSelect.value = '';
          }
        } else if (selectedValue === 'Online') {
          locationDetails.style.display = 'none';
          platformDetails.style.display = 'block';
          // Clear location input when switching to Online
          if (locationInput) {
            locationInput.value = '';
          }
        } else {
          locationDetails.style.display = 'none';
          platformDetails.style.display = 'none';
        }
      }

      // Initialize the correct field visibility based on current data
      function initializeFields() {
        const platformOptions = ['Zoom', 'Google Meet', 'Microsoft Teams', 'Webex'];
        
        if (meetingLocation === 'Online' || (meetingLocation && platformOptions.includes(meetingLocation))) {
          // Set to Online mode
          locationTypeSelect.value = 'Online';
          locationDetails.style.display = 'none';
          platformDetails.style.display = 'block';
          if (platformOptions.includes(meetingLocation) && platformSelect) {
            platformSelect.value = meetingLocation;
          }
        } else if (meetingLocation && meetingLocation !== '') {
          // Set to In-Person mode
          locationTypeSelect.value = 'In-Person';
          locationDetails.style.display = 'block';
          platformDetails.style.display = 'none';
          if (locationInput) {
            locationInput.value = meetingLocation;
          }
        } else {
          // No selection
          locationDetails.style.display = 'none';
          platformDetails.style.display = 'none';
        }
      }

      // Add event listener for mode selection change
      locationTypeSelect.addEventListener('change', toggleLocationFields);

      // Initialize fields on component mount
      initializeFields();

      return true;
    };

    // Try to initialize immediately
    if (!initializeForm()) {
      // If elements not found, retry after a short delay
      const retryInterval = setInterval(() => {
        if (initializeForm()) {
          clearInterval(retryInterval);
        }
      }, 100);

      // Stop retrying after 5 seconds
      setTimeout(() => {
        clearInterval(retryInterval);
        console.warn('Failed to initialize form after 5 seconds');
      }, 5000);
    }

    // Initialize Google Places Autocomplete when Google Maps API is loaded
    function initializeAutocomplete() {
      try {
        const locationInput = document.getElementById('location-input') as HTMLInputElement;
        if (typeof google !== 'undefined' && google.maps && google.maps.places && locationInput) {
          const autocomplete = new google.maps.places.Autocomplete(locationInput, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'au' } // Restrict to Australia, change as needed
          });

          autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
              locationInput.value = place.formatted_address;
            }
          });
          
          console.log('Google Places Autocomplete initialized successfully');
        } else {
          console.warn('Google Maps API not available - using manual input only');
        }
      } catch (error) {
        console.warn('Failed to initialize Google Places Autocomplete:', error);
      }
    }

    // Handle Google Maps API errors
    window.gm_authFailure = function() {
      console.warn('Google Maps API authentication failed - using manual input only');
    };

    // Check if Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
      initializeAutocomplete();
    } else {
      // Wait for Google Maps API to load
      window.initMap = initializeAutocomplete;
      
      // Also try to initialize after a delay in case the API loads asynchronously
      setTimeout(function() {
        if (typeof google === 'undefined') {
          console.warn('Google Maps API failed to load - using manual input only');
        } else {
          initializeAutocomplete();
        }
      }, 2000);
    }

    return () => {
      // Cleanup will be handled by the retry mechanism
    };
  }, [meetingLocation]);

  return (
    <>
      <script
        src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAHcXZQq3Y8iCLQLb9Z1KxFqpSMik5vPs0&libraries=places"
        async
        defer
      />
    </>
  );
}
