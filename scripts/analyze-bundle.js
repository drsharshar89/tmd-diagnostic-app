#!/usr/bin/env node

/**
 * Bundle Analysis Script for TMD Diagnostic Application
 * Provides detailed insights into bundle composition, size optimization opportunities,
 * and performance recommendations for medical-grade applications.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  distDir: path.join(process.cwd(), 'dist'),
  reportDir: path.join(process.cwd(), 'reports'),
  thresholds: {
    // Medical application performance thresholds
    maxBundleSize: 500 * 1024, // 500KB initial bundle
    maxChunkSize: 250 * 1024, // 250KB per chunk
    maxAssetSize: 100 * 1024, // 100KB per asset
    compressionRatio: 0.3, // 30% compression minimum
  },
  colors: {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  },
};

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCompressionRatio(original, compressed) {
  return compressed / original;
}

function colorize(text, color) {
  return `${CONFIG.colors[color]}${text}${CONFIG.colors.reset}`;
}

function printHeader(title) {
  const line = '='.repeat(60);
  console.log(colorize(line, 'cyan'));
  console.log(colorize(`🏥 ${title}`, 'bright'));
  console.log(colorize(line, 'cyan'));
}

function printSection(title) {
  console.log(colorize(`\n📊 ${title}`, 'blue'));
  console.log(colorize('-'.repeat(40), 'blue'));
}

// =====================================================
// ANALYSIS FUNCTIONS
// =====================================================

function analyzeDistDirectory() {
  if (!fs.existsSync(CONFIG.distDir)) {
    throw new Error(`Distribution directory not found: ${CONFIG.distDir}`);
  }

  const results = {
    totalSize: 0,
    files: [],
    chunks: {},
    assets: {},
    compressionAnalysis: {},
  };

  function scanDirectory(dir, relativePath = '') {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        scanDirectory(fullPath, relativeItemPath);
      } else {
        const fileInfo = {
          path: relativeItemPath,
          size: stats.size,
          type: path.extname(item),
          category: categorizeFile(relativeItemPath),
        };

        results.files.push(fileInfo);
        results.totalSize += stats.size;

        // Categorize files
        if (fileInfo.category === 'javascript') {
          results.chunks[relativeItemPath] = fileInfo;
        } else {
          results.assets[relativeItemPath] = fileInfo;
        }
      }
    }
  }

  scanDirectory(CONFIG.distDir);
  return results;
}

function categorizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath, ext);

  if (ext === '.js') {
    if (basename.includes('vendor') || basename.includes('react')) {
      return 'vendor';
    } else if (basename.includes('chunk') || basename.includes('lazy')) {
      return 'chunk';
    }
    return 'javascript';
  } else if (['.css'].includes(ext)) {
    return 'stylesheet';
  } else if (['.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico'].includes(ext)) {
    return 'image';
  } else if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
    return 'font';
  } else if (['.html'].includes(ext)) {
    return 'html';
  } else if (['.json', '.webmanifest'].includes(ext)) {
    return 'config';
  }

  return 'other';
}

function analyzeChunkSizes(analysis) {
  printSection('JavaScript Bundle Analysis');

  const jsFiles = analysis.files.filter(
    (f) => f.category === 'javascript' || f.category === 'vendor' || f.category === 'chunk'
  );
  const totalJSSize = jsFiles.reduce((sum, f) => sum + f.size, 0);

  console.log(`Total JavaScript Size: ${colorize(formatBytes(totalJSSize), 'bright')}`);

  // Sort by size descending
  jsFiles.sort((a, b) => b.size - a.size);

  console.log('\n📦 JavaScript Files by Size:');
  jsFiles.forEach((file, index) => {
    const sizeStr = formatBytes(file.size);
    const percentage = ((file.size / totalJSSize) * 100).toFixed(1);
    const status = file.size > CONFIG.thresholds.maxChunkSize ? 'red' : 'green';
    const icon = file.size > CONFIG.thresholds.maxChunkSize ? '⚠️' : '✅';

    console.log(`  ${icon} ${colorize(file.path, status)} - ${sizeStr} (${percentage}%)`);

    if (file.size > CONFIG.thresholds.maxChunkSize) {
      console.log(`    ${colorize('⚠️  Exceeds recommended chunk size', 'yellow')}`);
    }
  });

  return { jsFiles, totalJSSize };
}

function analyzeAssets(analysis) {
  printSection('Asset Analysis');

  const assetFiles = analysis.files.filter((f) =>
    ['stylesheet', 'image', 'font', 'config'].includes(f.category)
  );
  const totalAssetSize = assetFiles.reduce((sum, f) => sum + f.size, 0);

  console.log(`Total Asset Size: ${colorize(formatBytes(totalAssetSize), 'bright')}`);

  // Group by category
  const assetsByCategory = assetFiles.reduce((acc, file) => {
    if (!acc[file.category]) acc[file.category] = [];
    acc[file.category].push(file);
    return acc;
  }, {});

  Object.entries(assetsByCategory).forEach(([category, files]) => {
    const categorySize = files.reduce((sum, f) => sum + f.size, 0);
    const categoryPercentage = ((categorySize / totalAssetSize) * 100).toFixed(1);

    console.log(
      `\n📁 ${category.toUpperCase()} Files (${formatBytes(categorySize)} - ${categoryPercentage}%):`
    );

    files
      .sort((a, b) => b.size - a.size)
      .forEach((file) => {
        const sizeStr = formatBytes(file.size);
        const status = file.size > CONFIG.thresholds.maxAssetSize ? 'red' : 'green';
        const icon = file.size > CONFIG.thresholds.maxAssetSize ? '⚠️' : '✅';

        console.log(`  ${icon} ${colorize(file.path, status)} - ${sizeStr}`);
      });
  });

  return { assetFiles, totalAssetSize };
}

function generateOptimizationRecommendations(analysis, jsAnalysis, assetAnalysis) {
  printSection('Optimization Recommendations');

  const recommendations = [];

  // Bundle size recommendations
  if (analysis.totalSize > CONFIG.thresholds.maxBundleSize) {
    recommendations.push({
      type: 'critical',
      title: 'Bundle Size Too Large',
      description: `Total bundle size (${formatBytes(analysis.totalSize)}) exceeds medical app threshold (${formatBytes(CONFIG.thresholds.maxBundleSize)})`,
      actions: [
        'Implement more aggressive code splitting',
        'Remove unused dependencies',
        'Use dynamic imports for non-critical features',
        'Consider lazy loading heavy components',
      ],
    });
  }

  // Large chunk recommendations
  const largeChunks = jsAnalysis.jsFiles.filter((f) => f.size > CONFIG.thresholds.maxChunkSize);
  if (largeChunks.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Large JavaScript Chunks Detected',
      description: `${largeChunks.length} chunks exceed recommended size`,
      actions: [
        'Split large vendor libraries into separate chunks',
        'Use React.lazy() for route-based code splitting',
        'Consider splitting the Medical Protocol Engine into smaller modules',
        'Implement progressive loading for assessment components',
      ],
    });
  }

  // Asset optimization recommendations
  const largeAssets = assetAnalysis.assetFiles.filter(
    (f) => f.size > CONFIG.thresholds.maxAssetSize
  );
  if (largeAssets.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Large Assets Detected',
      description: `${largeAssets.length} assets exceed recommended size`,
      actions: [
        'Compress and optimize images',
        'Use WebP format for images',
        'Implement responsive image loading',
        'Consider using CSS sprites for small icons',
      ],
    });
  }

  // Medical app specific recommendations
  recommendations.push({
    type: 'info',
    title: 'Medical Application Performance',
    description: 'Additional optimizations for healthcare applications',
    actions: [
      'Implement service worker for offline functionality',
      'Add performance monitoring for diagnostic accuracy',
      'Use compression for patient data transmission',
      'Implement progressive enhancement for accessibility',
      'Add performance budgets to CI/CD pipeline',
    ],
  });

  // Display recommendations
  recommendations.forEach((rec) => {
    const icon = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : 'ℹ️';
    const color = rec.type === 'critical' ? 'red' : rec.type === 'warning' ? 'yellow' : 'blue';

    console.log(`\n${icon} ${colorize(rec.title, color)}`);
    console.log(`   ${rec.description}`);
    console.log('   Actions:');
    rec.actions.forEach((action) => {
      console.log(`     • ${action}`);
    });
  });

  return recommendations;
}

function generatePerformanceBudget(analysis, jsAnalysis, assetAnalysis) {
  printSection('Performance Budget Analysis');

  const budget = {
    total: CONFIG.thresholds.maxBundleSize,
    javascript: CONFIG.thresholds.maxBundleSize * 0.6, // 60% for JS
    assets: CONFIG.thresholds.maxBundleSize * 0.4, // 40% for assets
  };

  const actual = {
    total: analysis.totalSize,
    javascript: jsAnalysis.totalJSSize,
    assets: assetAnalysis.totalAssetSize,
  };

  const usage = {
    total: (actual.total / budget.total) * 100,
    javascript: (actual.javascript / budget.javascript) * 100,
    assets: (actual.assets / budget.assets) * 100,
  };

  console.log('📊 Performance Budget Status:');
  console.log(`\n  Total Bundle:`);
  console.log(`    Budget: ${formatBytes(budget.total)}`);
  console.log(`    Actual: ${formatBytes(actual.total)}`);
  console.log(
    `    Usage:  ${colorize(`${usage.total.toFixed(1)}%`, usage.total > 100 ? 'red' : usage.total > 80 ? 'yellow' : 'green')}`
  );

  console.log(`\n  JavaScript:`);
  console.log(`    Budget: ${formatBytes(budget.javascript)}`);
  console.log(`    Actual: ${formatBytes(actual.javascript)}`);
  console.log(
    `    Usage:  ${colorize(`${usage.javascript.toFixed(1)}%`, usage.javascript > 100 ? 'red' : usage.javascript > 80 ? 'yellow' : 'green')}`
  );

  console.log(`\n  Assets:`);
  console.log(`    Budget: ${formatBytes(budget.assets)}`);
  console.log(`    Actual: ${formatBytes(actual.assets)}`);
  console.log(
    `    Usage:  ${colorize(`${usage.assets.toFixed(1)}%`, usage.assets > 100 ? 'red' : usage.assets > 80 ? 'yellow' : 'green')}`
  );

  return { budget, actual, usage };
}

function saveReport(analysis, recommendations, budget) {
  if (!fs.existsSync(CONFIG.reportDir)) {
    fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSize: analysis.totalSize,
      totalFiles: analysis.files.length,
      javascriptFiles: Object.keys(analysis.chunks).length,
      assetFiles: Object.keys(analysis.assets).length,
    },
    files: analysis.files,
    recommendations: recommendations,
    performanceBudget: budget,
    thresholds: CONFIG.thresholds,
  };

  const reportPath = path.join(CONFIG.reportDir, `bundle-analysis-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\n💾 Report saved to: ${colorize(reportPath, 'green')}`);
  return reportPath;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  try {
    printHeader('TMD Application Bundle Analysis');

    console.log('🔍 Analyzing distribution directory...\n');

    // Analyze the built application
    const analysis = analyzeDistDirectory();

    console.log(`📦 Total Bundle Size: ${colorize(formatBytes(analysis.totalSize), 'bright')}`);
    console.log(`📄 Total Files: ${colorize(analysis.files.length.toString(), 'bright')}`);

    // Detailed analysis
    const jsAnalysis = analyzeChunkSizes(analysis);
    const assetAnalysis = analyzeAssets(analysis);

    // Generate recommendations
    const recommendations = generateOptimizationRecommendations(
      analysis,
      jsAnalysis,
      assetAnalysis
    );

    // Performance budget analysis
    const budget = generatePerformanceBudget(analysis, jsAnalysis, assetAnalysis);

    // Save detailed report
    const reportPath = saveReport(analysis, recommendations, budget);

    printSection('Summary');

    const isOptimal = analysis.totalSize <= CONFIG.thresholds.maxBundleSize;
    const statusIcon = isOptimal ? '✅' : '⚠️';
    const statusColor = isOptimal ? 'green' : 'yellow';

    console.log(
      `${statusIcon} Bundle Status: ${colorize(isOptimal ? 'OPTIMAL' : 'NEEDS OPTIMIZATION', statusColor)}`
    );
    console.log(
      `📊 Performance Score: ${colorize(Math.max(0, 100 - ((analysis.totalSize / CONFIG.thresholds.maxBundleSize) * 100 - 100)).toFixed(0), statusColor)}/100`
    );

    if (!isOptimal) {
      console.log(
        `\n🎯 Target Size Reduction: ${colorize(formatBytes(analysis.totalSize - CONFIG.thresholds.maxBundleSize), 'red')}`
      );
      console.log('📋 Review the recommendations above for optimization strategies.');
    }

    console.log(`\n🔗 For detailed analysis, open: ${colorize(reportPath, 'cyan')}`);
  } catch (error) {
    console.error(colorize(`❌ Error: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run the analysis
if (require.main === module) {
  main();
}

module.exports = {
  analyzeDistDirectory,
  generateOptimizationRecommendations,
  generatePerformanceBudget,
  CONFIG,
};
