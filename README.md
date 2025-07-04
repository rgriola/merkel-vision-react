# Merkel Vision React

A modern React rewrite of the Merkel-View application, providing enhanced location management with Google Maps integration.

## Overview

Merkel Vision React is a web application that allows users to:
- Save and manage location data with a modern, intuitive interface
- Display locations on an interactive Google Map
- Search for addresses and add new locations with ease
- Filter, sort, and organize saved locations

## Live Demo
Visit the live application: [https://rgriola.github.io/merkel-vision-react](https://rgriola.github.io/merkel-vision-react)

## Key Technologies

- **Frontend**: React 19, Material UI 7
- **Backend**: Firebase 11 (Authentication, Firestore)
- **APIs**: Google Maps JavaScript API, Places API (July 2025), Geocoding API
- **Routing**: React Router 7
- **Deployment**: GitHub Pages via GitHub Actions

## Project Structure

The project follows a modular structure for maintainability:

- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/services/` - Service modules for Firebase and Google Maps
- `src/contexts/` - React contexts for state management
- `src/hooks/` - Custom React hooks
- `src/config/` - Configuration files
- `src/utils/` - Utility functions

## Setup Instructions

Before running the application, you need to configure your Firebase and Google Maps API keys:

1. Update the Firebase configuration in `src/config/firebase.config.js`
2. Update the Google Maps API key in `src/config/maps.config.js`
3. Install dependencies with `npm install`
4. Run the application with `npm start`

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

## GitHub Pages Deployment

This project is set up for automatic deployment to GitHub Pages using GitHub Actions.

### Automatic Deployment

1. Push your changes to the `main` branch
2. GitHub Actions will automatically:
   - Build the application
   - Deploy to the `gh-pages` branch
   - Make the app available at your GitHub Pages URL

### Manual Deployment

You can also deploy manually using:

```bash
npm run deploy
```

This will build the app and push it to the `gh-pages` branch.

### Configuration for GitHub Pages

1. The `homepage` field in `package.json` specifies your GitHub Pages URL
2. We use HashRouter for compatibility with GitHub Pages
3. A custom 404.html page handles redirects for SPA routing

## API Keys

### Security Note for API Keys

When deploying to GitHub Pages, be aware that your API keys in the frontend code will be publicly visible.
For production use, consider:

1. Setting up API key restrictions in the Google Cloud Console:
   - HTTP referrer restrictions
   - IP address restrictions
   - API usage quotas

2. For Firebase, set up proper Firestore security rules to restrict access

## Special Features

### Modern Places API Integration (July 2025)

This application uses the latest Google Maps Places API with `PlaceAutocompleteElement`, 
which replaced the deprecated `Autocomplete` API as of March 1st, 2025.

Benefits include:
- Enhanced accessibility
- Improved mobile support
- Better internationalization
- More reliable place selection
