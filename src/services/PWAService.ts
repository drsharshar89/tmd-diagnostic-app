// PWA Service for offline functionality and app installation
interface PWAConfig {
  enableOffline: boolean;
  enableNotifications: boolean;
  enableBackgroundSync: boolean;
  cacheStrategy: 'networkFirst' | 'cacheFirst' | 'staleWhileRevalidate';
  maxCacheAge: number;
  criticalResources: string[];
}

interface InstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Default PWA configuration
const DEFAULT_PWA_CONFIG: PWAConfig = {
  enableOffline: true,
  enableNotifications: false,
  enableBackgroundSync: true,
  cacheStrategy: 'staleWhileRevalidate',
  maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
  criticalResources: [
    '/',
    '/quick-assessment',
    '/comprehensive-assessment',
    '/static/js/bundle.js',
    '/static/css/main.css',
  ],
};

export class PWAService {
  private config: PWAConfig;
  private serviceWorker: ServiceWorker | null = null;
  private installPrompt: InstallPromptEvent | null = null;
  private isOnline: boolean = navigator.onLine;
  private updateAvailable: boolean = false;

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = { ...DEFAULT_PWA_CONFIG, ...config };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    this.setupInstallPrompt();
    this.setupOnlineOfflineHandlers();
    this.setupNotifications();
    this.setupBackgroundSync();
  }

  // Register service worker
  private async registerServiceWorker(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('🔧 Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New service worker available
                this.updateAvailable = true;
                this.notifyUpdateAvailable();
              } else {
                // First time install
                this.notifyAppReady();
              }
            }
          });
        }
      });

      // Handle service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event);
      });

      this.serviceWorker = registration.active;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // Handle service worker messages
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, payload } = event.data;

    switch (type) {
      case 'CACHE_UPDATED':
        console.log('📱 Cache updated:', payload);
        break;
      case 'OFFLINE_ASSESSMENT_SAVED':
        this.notifyOfflineAssessmentSaved(payload);
        break;
      case 'BACKGROUND_SYNC_SUCCESS':
        this.notifyBackgroundSyncSuccess(payload);
        break;
      default:
        console.log('📨 Service Worker message:', event.data);
    }
  }

  // Setup app installation prompt
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as InstallPromptEvent;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('📱 PWA installed successfully');
      this.hideInstallButton();
      this.trackEvent('pwa_installed');
    });
  }

  // Show install button
  private showInstallButton(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => this.promptInstall());
    } else {
      // Create install button dynamically
      this.createInstallButton();
    }
  }

  // Create install button
  private createInstallButton(): void {
    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.innerHTML = '📱 Install App';
    button.className = 'pwa-install-btn';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    `;

    button.addEventListener('click', () => this.promptInstall());
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    document.body.appendChild(button);
  }

  // Hide install button
  private hideInstallButton(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Prompt app installation
  public async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ Install prompt not available');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const { outcome } = await this.installPrompt.userChoice;

      console.log(`🎯 Install prompt outcome: ${outcome}`);
      this.trackEvent('pwa_install_prompt', { outcome });

      if (outcome === 'accepted') {
        this.hideInstallButton();
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Install prompt error:', error);
      return false;
    }
  }

  // Setup online/offline handlers
  private setupOnlineOfflineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  // Handle online state
  private handleOnline(): void {
    console.log('🌐 Application is online');
    this.showOnlineStatus();
    this.syncOfflineData();
    this.trackEvent('app_online');
  }

  // Handle offline state
  private handleOffline(): void {
    console.log('📴 Application is offline');
    this.showOfflineStatus();
    this.trackEvent('app_offline');
  }

  // Show online status
  private showOnlineStatus(): void {
    this.updateConnectionStatus('Online - All features available', 'success');
  }

  // Show offline status
  private showOfflineStatus(): void {
    this.updateConnectionStatus('Offline - Limited functionality', 'warning');
  }

  // Update connection status UI
  private updateConnectionStatus(message: string, type: 'success' | 'warning' | 'error'): void {
    let statusElement = document.getElementById('connection-status');

    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.id = 'connection-status';
      statusElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 8px;
        text-align: center;
        font-size: 14px;
        z-index: 1001;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(statusElement);
    }

    const colors = {
      success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
      warning: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
      error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
    };

    const color = colors[type];
    statusElement.style.backgroundColor = color.bg;
    statusElement.style.color = color.text;
    statusElement.style.borderBottom = `1px solid ${color.border}`;
    statusElement.textContent = message;

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => {
        statusElement!.style.display = 'none';
      }, 3000);
    } else {
      statusElement.style.display = 'block';
    }
  }

  // Setup notifications
  private async setupNotifications(): Promise<void> {
    if (!this.config.enableNotifications || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('🔔 Notifications enabled');
      }
    }
  }

  // Send notification
  public sendNotification(title: string, options: NotificationOptions = {}): void {
    if (!this.config.enableNotifications || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/badge-icon.png',
      ...options,
    });

    notification.addEventListener('click', () => {
      window.focus();
      notification.close();
    });

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }

  // Setup background sync
  private setupBackgroundSync(): void {
    if (!this.config.enableBackgroundSync || !('serviceWorker' in navigator)) {
      return;
    }

    // Register background sync when offline assessments are saved
    window.addEventListener('assessment-saved-offline', (event: any) => {
      this.requestBackgroundSync('sync-assessments', event.detail);
    });
  }

  // Request background sync
  private async requestBackgroundSync(tag: string, data?: any): Promise<void> {
    if (!navigator.serviceWorker || !navigator.serviceWorker.ready) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      if ('sync' in registration) {
        await (registration as any).sync.register(tag);
        console.log(`🔄 Background sync registered: ${tag}`);

        // Store data for sync
        if (data) {
          localStorage.setItem(`sync_${tag}`, JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('❌ Background sync registration failed:', error);
    }
  }

  // Sync offline data
  private async syncOfflineData(): Promise<void> {
    const offlineAssessments = localStorage.getItem('offline_assessments');

    if (offlineAssessments) {
      try {
        const assessments = JSON.parse(offlineAssessments);

        for (const assessment of assessments) {
          await this.uploadAssessment(assessment);
        }

        // Clear offline assessments after successful sync
        localStorage.removeItem('offline_assessments');
        this.sendNotification('✅ Data synchronized', {
          body: 'Your offline assessments have been synchronized.',
        });
      } catch (error) {
        console.error('❌ Offline data sync failed:', error);
      }
    }
  }

  // Upload assessment
  private async uploadAssessment(assessment: any): Promise<void> {
    // This would typically make an API call
    console.log('📤 Uploading assessment:', assessment);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('✅ Assessment uploaded successfully');
        resolve();
      }, 1000);
    });
  }

  // Save assessment offline
  public saveAssessmentOffline(assessment: any): void {
    const offlineAssessments = JSON.parse(localStorage.getItem('offline_assessments') || '[]');

    assessment.offline = true;
    assessment.timestamp = new Date().toISOString();
    offlineAssessments.push(assessment);

    localStorage.setItem('offline_assessments', JSON.stringify(offlineAssessments));

    // Trigger custom event for background sync
    window.dispatchEvent(
      new CustomEvent('assessment-saved-offline', {
        detail: assessment,
      })
    );

    this.sendNotification('💾 Assessment saved offline', {
      body: "Your assessment will be synchronized when you're back online.",
    });
  }

  // Check if app update is available
  public isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  // Apply app update
  public async applyUpdate(): Promise<void> {
    if (!this.updateAvailable || !navigator.serviceWorker) {
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Notify update available
  private notifyUpdateAvailable(): void {
    this.updateConnectionStatus('🔄 App update available - Click to refresh', 'warning');

    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.style.cursor = 'pointer';
      statusElement.addEventListener('click', () => this.applyUpdate());
    }
  }

  // Notify app ready
  private notifyAppReady(): void {
    console.log('✅ App is ready for offline use');
    this.sendNotification('📱 App ready for offline use', {
      body: 'TMD Assessment app is now available offline.',
    });
  }

  // Notify offline assessment saved
  private notifyOfflineAssessmentSaved(assessment: any): void {
    console.log('💾 Offline assessment saved:', assessment);
  }

  // Notify background sync success
  private notifyBackgroundSyncSuccess(data: any): void {
    console.log('🔄 Background sync completed:', data);
    this.sendNotification('✅ Data synchronized', {
      body: 'Your offline data has been synchronized successfully.',
    });
  }

  // Track events
  private trackEvent(event: string, data?: any): void {
    // This would integrate with analytics service
    console.log('📊 PWA Event:', event, data);
  }

  // Get app info
  public getAppInfo(): {
    isOnline: boolean;
    isInstalled: boolean;
    updateAvailable: boolean;
    serviceWorkerSupported: boolean;
    notificationsSupported: boolean;
  } {
    return {
      isOnline: this.isOnline,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      updateAvailable: this.updateAvailable,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      notificationsSupported: 'Notification' in window,
    };
  }

  // Cleanup
  public cleanup(): void {
    this.hideInstallButton();

    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.remove();
    }
  }
}

// Create singleton instance
export const pwaService = new PWAService();

// Utility functions
export const isOnline = (): boolean => navigator.onLine;
export const isInstalled = (): boolean => window.matchMedia('(display-mode: standalone)').matches;
export const canInstall = (): boolean => pwaService.getAppInfo().serviceWorkerSupported;
