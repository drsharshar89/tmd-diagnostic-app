#!/usr/bin/env node

/**
 * Preview Server Setup Script for TMD Diagnostic Application
 * This script sets up various preview options for the application
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const open = require('open');

class PreviewManager {
  constructor() {
    this.servers = [];
  }

  async run() {
    console.log('🌐 TMD Application Preview Manager\n');

    try {
      await this.checkBuildExists();
      await this.showPreviewOptions();
    } catch (error) {
      console.error('❌ Preview setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkBuildExists() {
    const distPath = path.join(process.cwd(), 'dist');

    if (!fs.existsSync(distPath)) {
      console.log('📦 Build not found. Building application...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✓ Application built successfully\n');
    } else {
      console.log('✓ Build found\n');
    }
  }

  async showPreviewOptions() {
    console.log('🎯 Choose a preview option:\n');
    console.log('1. 🚀 Vite Preview Server (Recommended)');
    console.log('2. 📱 Local HTTP Server');
    console.log('3. 🌍 Ngrok Tunnel (Public Access)');
    console.log('4. 🐳 Docker Preview');
    console.log('5. 📊 Bundle Analyzer');
    console.log('6. 🔍 Lighthouse Audit');
    console.log('7. 🎭 All Options');

    const choice = await this.askQuestion('\nEnter your choice (1-7): ');

    switch (choice) {
      case '1':
        await this.startVitePreview();
        break;
      case '2':
        await this.startHttpServer();
        break;
      case '3':
        await this.startNgrokTunnel();
        break;
      case '4':
        await this.startDockerPreview();
        break;
      case '5':
        await this.runBundleAnalyzer();
        break;
      case '6':
        await this.runLighthouseAudit();
        break;
      case '7':
        await this.startAllOptions();
        break;
      default:
        console.log('Invalid choice. Starting Vite preview...');
        await this.startVitePreview();
    }
  }

  async startVitePreview() {
    console.log('🚀 Starting Vite Preview Server...\n');

    try {
      // Check if preview script exists
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (!packageJson.scripts.preview) {
        console.log('Adding preview script to package.json...');
        packageJson.scripts.preview = 'vite preview --port 3000 --host';
        fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      }

      console.log('📡 Server will be available at:');
      console.log('   Local:   http://localhost:3000');
      console.log('   Network: http://0.0.0.0:3000');
      console.log('\n⏳ Starting server...');

      // Start preview server
      const preview = spawn('npm', ['run', 'preview'], {
        stdio: 'inherit',
        shell: true,
      });

      this.servers.push(preview);

      // Wait a moment then open browser
      setTimeout(() => {
        console.log('\n🌐 Opening browser...');
        open('http://localhost:3000');
      }, 2000);

      // Handle server shutdown
      process.on('SIGINT', () => {
        console.log('\n👋 Shutting down preview server...');
        preview.kill();
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Failed to start Vite preview:', error.message);
    }
  }

  async startHttpServer() {
    console.log('📱 Starting Local HTTP Server...\n');

    const app = express();
    const port = 3001;

    // Serve static files from dist
    app.use(express.static('dist'));

    // Handle SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });

    const server = app.listen(port, () => {
      console.log('📡 Server is running at:');
      console.log(`   Local:   http://localhost:${port}`);
      console.log(`   Network: http://0.0.0.0:${port}`);

      // Open browser
      setTimeout(() => {
        console.log('\n🌐 Opening browser...');
        open(`http://localhost:${port}`);
      }, 1000);
    });

    this.servers.push(server);

    // Handle server shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down HTTP server...');
      server.close();
      process.exit(0);
    });
  }

  async startNgrokTunnel() {
    console.log('🌍 Starting Ngrok Tunnel for Public Access...\n');

    try {
      // Check if ngrok is installed
      try {
        execSync('ngrok version', { stdio: 'ignore' });
      } catch (error) {
        console.log('Installing ngrok...');
        execSync('npm install -g ngrok', { stdio: 'inherit' });
      }

      // Start local server first
      const app = express();
      const port = 3002;

      app.use(express.static('dist'));
      app.get('*', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      });

      const server = app.listen(port, () => {
        console.log(`✓ Local server started on port ${port}`);

        // Start ngrok tunnel
        console.log('🌐 Creating public tunnel...');
        const ngrok = spawn('ngrok', ['http', port.toString()], {
          stdio: 'pipe',
          shell: true,
        });

        // Parse ngrok output for public URL
        setTimeout(() => {
          console.log('\n📡 Ngrok tunnel created!');
          console.log('🔗 Check your ngrok dashboard for the public URL: http://localhost:4040');
          console.log('🌍 Your app is now publicly accessible!');

          // Open ngrok dashboard
          open('http://localhost:4040');
        }, 3000);

        this.servers.push(server, ngrok);
      });
    } catch (error) {
      console.error('❌ Failed to start ngrok tunnel:', error.message);
    }
  }

  async startDockerPreview() {
    console.log('🐳 Starting Docker Preview...\n');

    // Create Dockerfile if it doesn't exist
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile.preview');
    if (!fs.existsSync(dockerfilePath)) {
      const dockerfile = `FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.preview.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]`;

      fs.writeFileSync(dockerfilePath, dockerfile);
    }

    // Create nginx config
    const nginxConfig = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`;

    fs.writeFileSync('nginx.preview.conf', nginxConfig);

    try {
      console.log('🔨 Building Docker image...');
      execSync('docker build -f Dockerfile.preview -t tmd-preview .', { stdio: 'inherit' });

      console.log('🚀 Starting Docker container...');
      execSync('docker run -d -p 3003:80 --name tmd-preview-container tmd-preview', {
        stdio: 'inherit',
      });

      console.log('\n✓ Docker preview is running at:');
      console.log('   http://localhost:3003');

      setTimeout(() => {
        open('http://localhost:3003');
      }, 2000);
    } catch (error) {
      console.error('❌ Docker preview failed:', error.message);
    }
  }

  async runBundleAnalyzer() {
    console.log('📊 Running Bundle Analyzer...\n');

    try {
      // Install analyzer if not present
      try {
        require.resolve('webpack-bundle-analyzer');
      } catch (error) {
        console.log('Installing bundle analyzer...');
        execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
      }

      console.log('🔍 Analyzing bundle...');
      execSync('npx vite-bundle-analyzer dist', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Bundle analyzer not available. Showing basic stats...');

      const distPath = path.join(process.cwd(), 'dist');
      const stats = this.getBuildStats(distPath);

      console.log('\n📈 Build Statistics:');
      console.log(`   Total files: ${stats.fileCount}`);
      console.log(`   Total size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(
        `   Average file size: ${(stats.totalSize / stats.fileCount / 1024).toFixed(2)} KB`
      );
    }
  }

  async runLighthouseAudit() {
    console.log('🔍 Running Lighthouse Audit...\n');

    try {
      // Start a temporary server for lighthouse
      const app = express();
      const port = 3004;

      app.use(express.static('dist'));
      app.get('*', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
      });

      const server = app.listen(port, async () => {
        console.log('⏳ Starting Lighthouse audit...');

        try {
          // Install lighthouse if not present
          try {
            execSync('lighthouse --version', { stdio: 'ignore' });
          } catch (error) {
            console.log('Installing Lighthouse...');
            execSync('npm install -g lighthouse', { stdio: 'inherit' });
          }

          // Run lighthouse audit
          const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
          const reportPath = `lighthouse-report-${timestamp}.html`;

          execSync(
            `lighthouse http://localhost:${port} --output html --output-path ${reportPath}`,
            {
              stdio: 'inherit',
            }
          );

          console.log(`\n✓ Lighthouse audit complete!`);
          console.log(`📊 Report saved to: ${reportPath}`);

          // Open report
          setTimeout(() => {
            open(reportPath);
          }, 1000);
        } catch (error) {
          console.error('❌ Lighthouse audit failed:', error.message);
        } finally {
          server.close();
        }
      });
    } catch (error) {
      console.error('❌ Failed to run Lighthouse audit:', error.message);
    }
  }

  async startAllOptions() {
    console.log('🎭 Starting All Preview Options...\n');

    // Start multiple servers
    await this.startVitePreview();

    setTimeout(async () => {
      await this.startHttpServer();
    }, 2000);

    setTimeout(async () => {
      await this.runBundleAnalyzer();
    }, 4000);

    console.log('\n🎉 All preview options started!');
    console.log('📡 Available URLs:');
    console.log('   Vite Preview: http://localhost:3000');
    console.log('   HTTP Server:  http://localhost:3001');
    console.log('   Bundle Stats: Check console output');
  }

  getBuildStats(distPath) {
    let fileCount = 0;
    let totalSize = 0;

    const traverse = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory()) {
            traverse(filePath);
          } else {
            fileCount++;
            totalSize += stat.size;
          }
        });
      } catch (error) {
        // Ignore errors
      }
    };

    traverse(distPath);
    return { fileCount, totalSize };
  }

  askQuestion(question) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  cleanup() {
    this.servers.forEach((server) => {
      if (server.kill) {
        server.kill();
      } else if (server.close) {
        server.close();
      }
    });
  }
}

// Run the preview manager
if (require.main === module) {
  const manager = new PreviewManager();

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n👋 Cleaning up...');
    manager.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    manager.cleanup();
    process.exit(0);
  });

  manager.run().catch(console.error);
}

module.exports = PreviewManager;
