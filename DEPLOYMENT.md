# 🚀 Deployment Guide - Azure Static Web Apps

This guide will help you deploy ResolveMeQ to Azure Static Web Apps.

## 📋 Prerequisites

- Azure account with active subscription
- GitHub repository with your ResolveMeQ code
- Node.js 16+ installed locally for testing

## 🔧 Local Build Testing

Before deploying, test the build locally:

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Verify build output
ls -la build/
```

You should see:
- `index.html` - Main HTML file
- `assets/` - CSS and JavaScript files
- `vite.svg` - Static assets

## 🌐 Azure Static Web Apps Setup

### 1. Create Azure Static Web App

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Static Web App"
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `resolvemeq-webapp` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **Repository**: Your GitHub repository
   - **Branch**: `main`
   - **Build Preset**: Custom
   - **App location**: `/`
   - **API location**: Leave empty
   - **Output location**: `build`

### 2. Configure Build Settings

In the Azure Static Web App configuration:

- **App build command**: `npm run build`
- **API build command**: Leave empty
- **Output location**: `build`

### 3. Set Up GitHub Actions

The workflow file `.github/workflows/azure-static-web-apps.yml` is already configured. Azure will automatically:

1. Create the necessary GitHub secrets
2. Set up the deployment pipeline
3. Configure the build process

## 🔐 Authentication Setup (Optional)

If you want to add authentication to your deployed app:

1. In Azure Static Web Apps, go to "Authentication"
2. Choose your identity provider (GitHub, Azure AD, etc.)
3. Configure the authentication settings
4. Update the `staticwebapp.config.json` file with authentication rules

## 📁 Configuration Files

### `vite.config.js`
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // Azure Static Web Apps expects 'build'
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
      },
    },
  },
})
```

### `staticwebapp.config.json`
```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*", "/css/*", "/js/*", "/api/*", "/*.{png,jpg,gif,svg,css,js,ico,json}"]
  }
}
```

## 🚀 Deployment Process

1. **Push to GitHub**: Commit and push your changes to the `main` branch
2. **Automatic Build**: GitHub Actions will automatically trigger
3. **Azure Deployment**: Azure Static Web Apps will build and deploy
4. **Live URL**: Your app will be available at the provided Azure URL

## 🔍 Troubleshooting

### Build Fails
- Check that `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check the build logs in GitHub Actions

### 404 Errors
- Ensure `staticwebapp.config.json` is in the root directory
- Verify the `navigationFallback` configuration
- Check that all routes are properly configured

### Performance Issues
- The build includes code splitting for better performance
- Static assets are optimized and compressed
- Consider enabling Azure CDN for global distribution

## 📊 Monitoring

Once deployed, you can monitor your app in Azure:

- **Overview**: Basic metrics and status
- **Usage**: Traffic and performance data
- **Functions**: Serverless function logs (if used)
- **Authentication**: User authentication logs

## 🔄 Continuous Deployment

The GitHub Actions workflow automatically:

- Builds on every push to `main`
- Deploys to production
- Handles pull request previews
- Cleans up preview environments

## 🌍 Custom Domain (Optional)

To add a custom domain:

1. Go to "Custom domains" in Azure Static Web Apps
2. Add your domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

## 📱 Environment Variables

If you need environment variables:

1. Add them in Azure Static Web Apps configuration
2. They will be available as `process.env.VARIABLE_NAME`
3. Remember to rebuild after adding variables

## 🎯 Next Steps

After successful deployment:

1. Test all features in the live environment
2. Set up monitoring and alerts
3. Configure custom domain (if needed)
4. Set up authentication (if required)
5. Monitor performance and usage

---

**Your ResolveMeQ application is now ready for production deployment! 🚀** 