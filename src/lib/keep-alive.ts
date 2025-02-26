/**
 * This module provides functionality to keep Netlify functions warm by periodically
 * pinging API endpoints to prevent cold starts and connection timeouts.
 */

// Track which endpoints have been pinged
const pingedEndpoints = new Set<string>();

// Track ping success/failure
let consecutiveFailures = 0;
let lastSuccessTime = Date.now();

/**
 * Setup function to initialize keep-alive pings for critical API endpoints
 */
export function setupKeepAlive() {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  const pingEndpoints = async () => {
    const timestamp = Date.now();
    
    // List of critical endpoints to keep warm
    const endpoints = [
      `/api/search?q=test&t=${timestamp}`,
      `/api/daily?hour=${new Date().getHours()}&t=${timestamp}`,
      `/api/random?t=${timestamp}`
    ];
    
    // Try to ping each endpoint
    for (const endpoint of endpoints) {
      try {
        // Add a unique timestamp and cache-busting parameter
        const url = endpoint.includes('?') 
          ? `${endpoint}&_=${Math.random()}`
          : `${endpoint}?_=${Math.random()}`;
          
        // Ping with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          // Track successful ping
          pingedEndpoints.add(endpoint.split('?')[0]);
          consecutiveFailures = 0;
          lastSuccessTime = Date.now();
          console.log(`Keep-alive ping successful: ${endpoint.split('?')[0]}`);
        } else {
          console.warn(`Keep-alive ping failed with status ${response.status}: ${endpoint.split('?')[0]}`);
          consecutiveFailures++;
        }
      } catch (error) {
        console.error(`Keep-alive ping error for ${endpoint.split('?')[0]}:`, 
          error instanceof Error ? error.message : error);
        consecutiveFailures++;
      }
    }
    
    // If we've had too many failures or it's been too long since a success,
    // try a more aggressive recovery - reload the page
    const now = Date.now();
    if ((consecutiveFailures > 5 || now - lastSuccessTime > 30 * 60 * 1000) && 
        document.visibilityState === 'hidden') {
      console.log('Too many ping failures or too long since last success. Reloading page...');
      // Only reload if the page is in the background to avoid disrupting the user
      window.location.reload();
    }
  };
  
  // Initial ping after page load (with a delay to not impact initial page load)
  const initialDelay = Math.random() * 5000 + 5000; // Random delay between 5-10 seconds
  setTimeout(() => {
    pingEndpoints();
  }, initialDelay);
  
  // Regular pings every 5 minutes (with a slight randomization to prevent thundering herd)
  const interval = 5 * 60 * 1000 + (Math.random() * 30000); // 5 minutes + random 0-30 seconds
  setInterval(pingEndpoints, interval);
  
  // Also ping when the page becomes visible again after being hidden
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Only ping if we haven't pinged in the last minute
      const now = Date.now();
      if (now - lastSuccessTime > 60 * 1000) {
        console.log('Page became visible, pinging endpoints...');
        pingEndpoints();
      }
    }
  });
  
  return {
    getPingedEndpoints: () => Array.from(pingedEndpoints),
    getConsecutiveFailures: () => consecutiveFailures,
    getLastSuccessTime: () => lastSuccessTime,
    pingNow: pingEndpoints // Expose method to trigger a ping on demand
  };
}