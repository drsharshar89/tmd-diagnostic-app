# TMD Diagnostic Application - Deployment Guide

## Overview

This guide covers the deployment of the TMD (Temporomandibular Disorder) diagnostic application with full production readiness, including PWA capabilities, offline functionality, security compliance, and monitoring.

## Prerequisites

### System Requirements

- Node.js 18.x or higher
- npm 8.x or higher
- Modern browser with Service Worker support
- HTTPS required for PWA features
- Memory: 4GB RAM minimum for build process
- Storage: 2GB available disk space

### Required Environment Variables

Create `.env.production` file:

```bash
# Application Configuration
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_BUILD_DATE=2024-01-01

# API Configuration
REACT_APP_API_URL=https://api.tmd-app.com
REACT_APP_API_TIMEOUT=30000

# Analytics & Monitoring
REACT_APP_ANALYTICS_ID=GA-XXXXXXXXX
REACT_APP_ANALYTICS_ENDPOINT=https://analytics.tmd-app.com/collect
REACT_APP_ERROR_TRACKING_DSN=https://sentry.io/xxxx

# Security Configuration
REACT_APP_CSP_NONCE=generate-unique-nonce
REACT_APP_ENABLE_SECURITY_HEADERS=true
REACT_APP_AUDIT_ENDPOINT=https://audit.tmd-app.com

# PWA Configuration
REACT_APP_PWA_NAME="TMD Assessment"
REACT_APP_PWA_SHORT_NAME="TMD"
REACT_APP_PWA_THEME_COLOR="#667eea"
REACT_APP_PWA_BACKGROUND_COLOR="#ffffff"

# Medical Compliance
REACT_APP_HIPAA_COMPLIANT=true
REACT_APP_ENCRYPT_LOCAL_DATA=true
REACT_APP_MAX_DATA_RETENTION_DAYS=30
```

## Build Process

### 1. Install Dependencies

```bash
# Install all dependencies
npm ci

# Verify installation
npm ls --depth=0
```

### 2. Run Quality Checks

```bash
# Lint code
npm run lint

# Type checking
npm run type-check

# Run all tests
npm run test:ci

# Security audit
npm audit --audit-level=moderate
```

### 3. Build Application

```bash
# Production build
npm run build

# Verify build output
ls -la dist/
```

### 4. Generate Service Worker

The service worker is automatically generated during build. Verify it exists:

```bash
ls -la dist/sw.js
```

## Deployment Options

### Option 1: Static Hosting (Recommended)

#### Netlify Deployment

1. **Connect Repository**

   ```bash
   # netlify.toml configuration
   [build]
     publish = "dist"
     command = "npm run build"

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [[headers]]
     for = "/sw.js"
     [headers.values]
       Cache-Control = "public, max-age=0"
   ```

2. **Environment Variables**
   Set all environment variables in Netlify dashboard.

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

#### Vercel Deployment

1. **vercel.json Configuration**

   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/static-build",
         "config": {
           "distDir": "dist"
         }
       }
     ],
     "routes": [
       {
         "src": "/sw.js",
         "headers": {
           "Cache-Control": "public, max-age=0"
         }
       },
       {
         "src": "/(.*)",
         "dest": "/index.html"
       }
     ]
   }
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

### Option 2: Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
RUN apk add --no-cache curl

# Copy build files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Service Worker caching
        location /sw.js {
            add_header Cache-Control "public, max-age=0";
            add_header Service-Worker-Allowed "/";
        }

        # PWA manifest
        location /manifest.json {
            add_header Cache-Control "public, max-age=86400";
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Security - hide nginx version
        server_tokens off;
    }
}
```

#### Deploy with Docker

```bash
# Build image
docker build -t tmd-app:latest .

# Run container
docker run -d \
  --name tmd-app \
  -p 80:80 \
  --restart unless-stopped \
  tmd-app:latest
```

## Post-Deployment Configuration

### 1. DNS and SSL Setup

```bash
# Example with Let's Encrypt
certbot --nginx -d tmd-app.com -d www.tmd-app.com
```

### 2. CDN Configuration (Cloudflare)

```javascript
// Cloudflare Worker for additional security
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);

  // Add security headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  newHeaders.set('X-Frame-Options', 'SAMEORIGIN');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
```

### 3. Monitoring Setup

#### Application Performance Monitoring

```javascript
// Configure in production
import { analyticsService } from './src/services/AnalyticsService';

analyticsService.configure({
  enableTracking: true,
  enablePerformanceMonitoring: true,
  apiEndpoint: process.env.REACT_APP_ANALYTICS_ENDPOINT,
  samplingRate: 0.1, // 10% sampling in production
});
```

#### Error Tracking (Sentry)

```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_ERROR_TRACKING_DSN,
  environment: process.env.REACT_APP_ENV,
  tracesSampleRate: 0.1,
});
```

### 4. PWA Registration

Ensure Service Worker is properly registered:

```javascript
// In main.tsx
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
```

## Verification Checklist

### Performance Verification

```bash
# Run Lighthouse audit
npm run lighthouse:ci

# Check bundle size
npm run analyze

# Performance testing
npm run test:performance
```

### Security Verification

```bash
# Security audit
npm audit --audit-level=moderate

# HIPAA compliance check
npm run test:hipaa-compliance

# Vulnerability scan
npm run security:scan
```

### Accessibility Verification

```bash
# A11y testing
npm run test:accessibility

# Manual testing checklist:
# ✅ Keyboard navigation works
# ✅ Screen reader compatibility
# ✅ Color contrast meets WCAG 2.1 AA
# ✅ Focus indicators visible
# ✅ Alternative text for images
```

### PWA Verification

1. **Install Prompt**: App shows install banner
2. **Offline Functionality**: App works without internet
3. **Service Worker**: SW registered and caching resources
4. **Manifest**: Web app manifest is valid
5. **Responsive**: Works on mobile and desktop

### Medical Compliance Verification

```bash
# Medical algorithm testing
npm run test:medical-compliance

# Data encryption verification
npm run test:encryption

# Audit trail testing
npm run test:audit-trail
```

## Monitoring and Maintenance

### 1. Health Checks

Set up monitoring for:

- Application availability (99.9% uptime SLA)
- Response times (<2s page load)
- Error rates (<0.1% error rate)
- PWA functionality
- Security headers presence

### 2. Log Monitoring

```bash
# Example log aggregation
# Application logs -> Centralized logging (ELK Stack, Splunk)
# Performance metrics -> APM (New Relic, Datadog)
# Error tracking -> Sentry, Bugsnag
```

### 3. Security Monitoring

- Regular security scans
- Dependency vulnerability monitoring
- SSL certificate renewal
- HIPAA compliance audits

### 4. Performance Monitoring

```javascript
// Real-time performance monitoring
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];

  // Track Core Web Vitals
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(console.log);
    getFID(console.log);
    getFCP(console.log);
    getLCP(console.log);
    getTTFB(console.log);
  });
});
```

## Rollback Procedures

### 1. Quick Rollback

```bash
# Revert to previous deployment
git revert HEAD
npm run build
npm run deploy

# Or use platform-specific rollback
netlify rollback
# or
vercel rollback
```

### 2. Database Rollback (if applicable)

```bash
# Backup current state
npm run backup:data

# Restore previous version
npm run restore:data --version=previous
```

## Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Verify HTTPS is enabled
   - Check sw.js is served correctly
   - Clear browser cache

2. **PWA Install Prompt Not Showing**
   - Verify manifest.json is valid
   - Check service worker registration
   - Ensure HTTPS deployment

3. **Offline Functionality Not Working**
   - Verify service worker caching strategy
   - Check network requests in DevTools
   - Test offline.html page accessibility

4. **Performance Issues**
   - Check bundle size and optimize
   - Verify CDN configuration
   - Review caching strategies

### Debug Commands

```bash
# Development debugging
npm run dev:debug

# Production debugging
npm run build:debug

# Service worker debugging
npm run debug:sw
```

## Support and Documentation

- **Technical Documentation**: `/docs/technical/`
- **API Documentation**: `/docs/api/`
- **User Documentation**: `/docs/user/`
- **Compliance Documentation**: `/docs/compliance/`

For additional support, contact the development team or refer to the issue tracker in the repository.

---

## Deployment Summary

✅ **Production Ready**: Comprehensive testing, security, and compliance
✅ **PWA Enabled**: Offline functionality, install prompts, service worker
✅ **HIPAA Compliant**: Data encryption, audit trails, security measures
✅ **Performance Optimized**: Bundle optimization, caching strategies
✅ **Accessible**: WCAG 2.1 AA compliance, keyboard navigation
✅ **Monitored**: Analytics, error tracking, performance monitoring
✅ **Secure**: Security headers, vulnerability scanning, regular audits

The TMD Diagnostic Application is now ready for production deployment in healthcare environments.
