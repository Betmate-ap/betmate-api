# GitHub Secrets Setup for Railway Deployment

This guide will help you configure the required GitHub secrets for Railway deployment.

## 🚨 Current Issue

Your deployment is failing because GitHub secrets are not configured. You need to add Railway credentials to your GitHub repository.

## 📋 Required Secrets

### Essential Secrets (Required)

- `RAILWAY_TOKEN` - Your Railway authentication token
- `RAILWAY_PROJECT_ID` - Your Railway project ID (optional but recommended)

### Environment Secrets (Optional)

- `STAGING_DATABASE_URL` - Database URL for staging
- `STAGING_JWT_SECRET` - JWT secret for staging
- `STAGING_CORS_ORIGIN` - CORS origin for staging
- `PRODUCTION_DATABASE_URL` - Database URL for production
- `PRODUCTION_JWT_SECRET` - JWT secret for production
- `PRODUCTION_CORS_ORIGIN` - CORS origin for production

## 🔧 Step-by-Step Setup

### Step 1: Get Your Railway Token

1. **Open Terminal/Command Prompt**
2. **Login to Railway:**

   ```bash
   railway login
   ```

   This will open a browser window for authentication.

3. **Get your token from Railway Dashboard:**
   - Go to [Railway Dashboard → Account → Tokens](https://railway.app/account/tokens)
   - Click "Create New Token"
   - Give it a name like "GitHub Actions"
   - **Copy the token that appears** - you'll need this for GitHub

   **Alternative method (browserless):**

   ```bash
   railway login --browserless
   ```

   This will give you a token directly in the terminal.

### Step 2: Get Your Project ID (Optional)

```bash
railway status
```

Copy the Project ID from the output.

### Step 3: Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Click on "Settings" tab**
3. **In the left sidebar, click "Secrets and variables" → "Actions"**
4. **Click "New repository secret"**
5. **Add each secret:**

#### Add RAILWAY_TOKEN

- **Name:** `RAILWAY_TOKEN`
- **Secret:** Paste the token from `railway auth` command
- **Click "Add secret"**

#### Add RAILWAY_PROJECT_ID (Optional)

- **Name:** `RAILWAY_PROJECT_ID`
- **Secret:** Paste the project ID from `railway status` command
- **Click "Add secret"**

#### Add Environment Variables (Optional)

Add these if you want to set environment-specific variables:

- `STAGING_DATABASE_URL`
- `STAGING_JWT_SECRET`
- `STAGING_CORS_ORIGIN`
- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_JWT_SECRET`
- `PRODUCTION_CORS_ORIGIN`

## ✅ Verification

After adding the secrets:

1. **Go to Actions tab in your GitHub repository**
2. **Re-run the failed workflow**
3. **You should see:** ✅ All required Railway secrets are configured

## 🚀 Deployment Commands

### Automatic Deployment

- **Staging:** Push to `main` branch
- **Production:** Use "Deploy to Production" workflow (manual trigger)

### Manual Deployment

```bash
# Staging
npm run deploy:staging

# Production
npm run deploy:production
```

## 🔍 Troubleshooting

### "RAILWAY_TOKEN is not configured"

- Make sure you added `RAILWAY_TOKEN` secret exactly as shown above
- Double-check the token value from `railway auth`

### "Authentication failed"

- Your Railway token might be expired
- Run `railway login` and `railway auth` again
- Update the GitHub secret with the new token

### "Service not found"

- Add `RAILWAY_PROJECT_ID` secret
- Make sure you're using the correct project ID from `railway status`

## 📞 Need Help?

1. **Check Railway Dashboard:** https://railway.app
2. **Railway Documentation:** https://docs.railway.app/
3. **View deployment logs in GitHub Actions**

## 🎯 Quick Summary

**Required Actions:**

1. **Get Railway token:**
   - Go to [Railway Dashboard → Tokens](https://railway.app/account/tokens)
   - Create new token → Copy it
   - OR run `railway login --browserless` → Copy token
2. **Add to GitHub:**
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add `RAILWAY_TOKEN` secret with the copied token
3. **Re-run your GitHub Action**

That's it! Your deployments should now work. 🚀
