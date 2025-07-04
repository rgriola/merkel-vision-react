#!/bin/bash

# GitHub Repository Setup Script for Merkel-Vision-React

echo "Setting up GitHub repository for Merkel-Vision-React..."

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
fi

# Set username and email if provided
if [ ! -z "$1" ] && [ ! -z "$2" ]; then
    git config user.name "$1"
    git config user.email "$2"
    echo "Git user configured as: $1 <$2>"
else
    echo "No username/email provided. Using existing git config."
fi

# Create .gitignore file if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "Creating .gitignore file..."
    cat > .gitignore << EOL
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.env

npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOL
fi

# Add all files
git add .

# Commit changes
git commit -m "Initial commit for Merkel-Vision-React"

# Instructions for setting up remote repository
echo ""
echo "============================================================"
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run the following commands to push to GitHub:"
echo ""
echo "   git remote add origin https://github.com/rgriola/merkel-vision-react.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Replace 'USERNAME' with your GitHub username in:"
echo "   - package.json (homepage field)"
echo "   - README.md (deployment URL)"
echo "============================================================"

# Ask about deploying to GitHub Pages
read -p "Do you want to deploy to GitHub Pages now? (y/n) " deploy_choice
if [ "$deploy_choice" = "y" ] || [ "$deploy_choice" = "Y" ]; then
    npm run deploy
    echo "Deployed to GitHub Pages! Your site should be available soon at: https://rgriola.github.io/merkel-vision-react"
fi

echo "Setup complete!"
