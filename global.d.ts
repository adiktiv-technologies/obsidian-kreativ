/**
 * Global type declarations for Kreativ plugin
 */

// Declare Node.js modules for desktop-only plugin
declare module 'fs';
declare module 'path';

// Declare global gc function
declare namespace NodeJS {
    interface Global {
        gc?: () => void;
    }
}

declare var global: NodeJS.Global;
