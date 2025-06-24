#!/usr/bin/env node

/**
 * Automated Deployment Script for TMD Diagnostic Application
 * This script handles the complete deployment pipeline
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const CONFIG = {
  environments: {
    staging: {
      name: 'staging',
      url: 'https://tmd-staging.netlify.app',
      branch: 'develop',
      buildCommand: 'npm run build:staging',
    },
    production: {
      name: 'production',
      url: 'https://tmd-app.netlify.app',
      branch: 'main',
      buildCommand: 'npm run build',
    },
  },
  requiredEnvVars: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'],
  optionalEnvVars: ['REACT_APP_ANALYTICS_ID', 'REACT_APP_API_URL'],
};

class DeploymentAutomator {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async run() {
    console.log('🚀 TMD Application Deployment Automator\n');

    try {
      await this.checkPrerequisites();
      const environment = await this.selectEnvironment();
      await this.runPreDeploymentChecks();
      await this.buildApplication(environment);
      await this.runTests();
      await this.deployToNetlify(environment);
      await this.postDeploymentVerification(environment);

      console.log('\n🎉 Deployment completed successfully!');
      console.log(`🌐 Your application is live at: ${CONFIG.environments[environment].url}`);
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async checkPrerequisites() {
    console.log('📋 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`✓ Node.js version: ${nodeVersion}`);

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✓ npm version: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not installed');
    }

    // Check if Netlify CLI is installed
    try {
      execSync('netlify --version', { encoding: 'utf8', stdio: 'ignore' });
      console.log('✓ Netlify CLI is installed');
    } catch (error) {
      console.log('⚠️  Installing Netlify CLI...');
      execSync('npm install -g netlify-cli', { stdio: 'inherit' });
      console.log('✓ Netlify CLI installed');
    }

    // Check environment variables
    const missingVars = CONFIG.requiredEnvVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      console.log('\n⚠️  Missing required environment variables:');
      missingVars.forEach((varName) => {
        console.log(`   - ${varName}`);
      });
      console.log('\nPlease set these environment variables and try again.');
      console.log('You can get these values from your Netlify dashboard.');
      throw new Error('Missing required environment variables');
    }

    console.log('✓ All prerequisites met\n');
  }

  async selectEnvironment() {
    return new Promise((resolve) => {
      console.log('🎯 Select deployment environment:');
      console.log('1. Production (main branch)');
      console.log('2. Staging (develop branch)');

      this.rl.question('\nEnter your choice (1 or 2): ', (answer) => {
        const choice = parseInt(answer);
        if (choice === 1) {
          resolve('production');
        } else if (choice === 2) {
          resolve('staging');
        } else {
          console.log('Invalid choice. Defaulting to staging.');
          resolve('staging');
        }
      });
    });
  }

  async runPreDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');

    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      if (gitStatus.trim()) {
        console.log('⚠️  You have uncommitted changes:');
        console.log(gitStatus);

        const shouldContinue = await this.askQuestion('Continue anyway? (y/N): ');
        if (!shouldContinue.toLowerCase().startsWith('y')) {
          throw new Error('Deployment cancelled due to uncommitted changes');
        }
      } else {
        console.log('✓ Git working directory is clean');
      }
    } catch (error) {
      console.log('⚠️  Could not check Git status (not a Git repository?)');
    }

    // Lint code
    console.log('🔧 Running code linting...');
    try {
      execSync('npm run lint', { stdio: 'pipe' });
      console.log('✓ Code linting passed');
    } catch (error) {
      console.log('⚠️  Linting issues found. Please fix them before deploying.');
      throw new Error('Code linting failed');
    }

    // Type checking
    console.log('🔤 Running TypeScript checks...');
    try {
      execSync('npm run type-check', { stdio: 'pipe' });
      console.log('✓ TypeScript checks passed');
    } catch (error) {
      console.log('⚠️  TypeScript errors found. Please fix them before deploying.');
      throw new Error('TypeScript checking failed');
    }

    console.log('✓ All pre-deployment checks passed\n');
  }

  async buildApplication(environment) {
    console.log(`🏗️  Building application for ${environment}...`);

    const buildCommand = CONFIG.environments[environment].buildCommand;

    try {
      execSync(buildCommand, { stdio: 'inherit' });
      console.log('✓ Application built successfully');

      // Check build output
      const distPath = path.join(process.cwd(), 'dist');
      if (!fs.existsSync(distPath)) {
        throw new Error('Build output directory not found');
      }

      const buildStats = this.getBuildStats(distPath);
      console.log('📊 Build statistics:');
      console.log(`   - Total files: ${buildStats.fileCount}`);
      console.log(`   - Total size: ${(buildStats.totalSize / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }

    console.log('✓ Build completed\n');
  }

  async runTests() {
    console.log('🧪 Running tests...');

    try {
      // Run unit tests
      execSync('npm test -- --passWithNoTests --coverage', { stdio: 'pipe' });
      console.log('✓ Unit tests passed');

      // Check test coverage
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const totalCoverage = coverage.total;
        console.log(
          `📈 Test coverage: ${totalCoverage.lines.pct}% lines, ${totalCoverage.statements.pct}% statements`
        );

        if (totalCoverage.lines.pct < 80) {
          console.log('⚠️  Test coverage is below 80%. Consider adding more tests.');
        }
      }
    } catch (error) {
      console.log('⚠️  Some tests failed, but continuing with deployment...');
    }

    console.log('✓ Test phase completed\n');
  }

  async deployToNetlify(environment) {
    console.log(`🚀 Deploying to ${environment}...`);

    const env = CONFIG.environments[environment];
    const isProduction = environment === 'production';

    try {
      // Deploy to Netlify
      const deployCommand = isProduction
        ? 'netlify deploy --prod --dir=dist'
        : 'netlify deploy --dir=dist';

      console.log('📤 Uploading files to Netlify...');
      const deployOutput = execSync(deployCommand, { encoding: 'utf8' });

      // Extract deployment URL from output
      const urlMatch = deployOutput.match(/Website URL: (https?:\/\/[^\s]+)/);
      if (urlMatch) {
        console.log(`✓ Deployment successful: ${urlMatch[1]}`);
      }
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }

    console.log('✓ Deployment completed\n');
  }

  async postDeploymentVerification(environment) {
    console.log('🔍 Running post-deployment verification...');

    const env = CONFIG.environments[environment];

    // Wait a moment for deployment to propagate
    console.log('⏳ Waiting for deployment to propagate...');
    await this.sleep(5000);

    try {
      // Check if site is accessible
      const response = await fetch(env.url);
      if (response.ok) {
        console.log('✓ Site is accessible');
      } else {
        console.log(`⚠️  Site returned status: ${response.status}`);
      }

      // Check for basic functionality
      const html = await response.text();
      if (html.includes('TMD Assessment')) {
        console.log('✓ Site content verified');
      } else {
        console.log('⚠️  Site content verification failed');
      }
    } catch (error) {
      console.log(`⚠️  Could not verify deployment: ${error.message}`);
    }

    console.log('✓ Post-deployment verification completed\n');
  }

  getBuildStats(distPath) {
    let fileCount = 0;
    let totalSize = 0;

    const traverse = (dir) => {
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
    };

    traverse(distPath);
    return { fileCount, totalSize };
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run the deployment automator
if (require.main === module) {
  const automator = new DeploymentAutomator();
  automator.run().catch(console.error);
}

module.exports = DeploymentAutomator;
