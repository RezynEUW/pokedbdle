/**
 * Utilities for consistent cache handling in API routes
 */

import { NextResponse } from 'next/server';

/**
 * Standard HTTP headers to prevent caching
 */
export const NO_CACHE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

/**
 * Headers for resources that can be cached for a short time
 * @param maxAgeSeconds The maximum age in seconds for the cache
 */
export function shortCacheHeaders(maxAgeSeconds: number = 60) {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': `public, max-age=${maxAgeSeconds}, s-maxage=${maxAgeSeconds * 2}, stale-while-revalidate=${maxAgeSeconds * 10}`,
  };
}

/**
 * Create a Response with no-cache headers
 * @param data The data to include in the response
 * @param options Additional options for the response
 */
export function createNoCacheResponse(
    data: Record<string, unknown>, 
    options: { status?: number; headers?: Record<string, string> } = {}
  ) {
  const { status = 200, headers = {} } = options;
  
  return NextResponse.json(data, {
    status,
    headers: {
      ...NO_CACHE_HEADERS,
      ...headers
    }
  });
}

/**
 * Create a Response with error details and no-cache headers
 * @param message Error message
 * @param status HTTP status code
 * @param additionalData Any additional data to include
 */
export function createErrorResponse(
    message: string, 
    status: number = 500, 
    additionalData: Record<string, unknown> = {}
  ) {
  return NextResponse.json(
    { 
      error: message, 
      timestamp: new Date().toISOString(),
      ...additionalData
    }, 
    {
      status,
      headers: NO_CACHE_HEADERS
    }
  );
}

/**
 * Add standard no-cache headers to an existing Response object
 * @param response The Response object to modify
 */
export function addNoCacheHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  
  Object.entries(NO_CACHE_HEADERS).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}