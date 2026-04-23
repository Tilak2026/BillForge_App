// ══════════════════════════════════════
// API BASE PATH (auto-detect subdirectory)
// Works whether hosted at / or /BillForge_App/
// ══════════════════════════════════════
const API_BASE = (() => {
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // Default to localhost/BillForge_App if on localhost or file protocol
  if (host.includes('localhost') || host.includes('127.0.0.1') || protocol === 'file:') {
    return 'http://localhost/BillForge_App/api';
  }
  
  // For remote/production, build path dynamically
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);
  
  // Find index of 'public' folder
  const pubIdx = parts.indexOf('public');
  
  let base = '';
  if (pubIdx > 0) {
    base = '/' + parts.slice(0, pubIdx).join('/');
  } else if (parts[0] && parts[0] !== 'api') {
    base = '/' + parts[0];
  }
  
  return protocol + '//' + host + base + '/api';
})();


let products = [];
let customers = [];
let invoices = [];
let expenses = [];
let quotations = [];
let purchases = [];

let cart = {};
let selectedPayment = 'cash';

// Demo credentials for testing - STILL WORKING with database authentication
// These are now just convenient test accounts - actual login validates against database
const USERS = [
  { email: 'admin@billforge.in',  password: 'admin123', name: 'Admin User',    role: 'Super Admin', avatar: 'AD' },
  { email: 'cashier@billforge.in', password: 'cashier123',   name: 'Cashier User',  role: 'Cashier',     avatar: 'CA' },
  { email: 'viewer@billforge.in',  password: 'viewer123',    name: 'Viewer User',   role: 'Viewer',      avatar: 'VI' }
];

let currentUser = JSON.parse(localStorage.getItem('billforge_user')) || null;