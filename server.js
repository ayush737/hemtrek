import express from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const app = express();
const port = process.env.PORT || 4173;
const dataDir = join(process.cwd(), 'data');
const enquiriesFile = join(dataDir, 'enquiries.json');
const sessions = new Map();

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(enquiriesFile)) writeFileSync(enquiriesFile, '[]\n');

app.use(express.json());

function readEnquiries() {
  try { return JSON.parse(readFileSync(enquiriesFile, 'utf8')); }
  catch { return []; }
}
function saveEnquiries(enquiries) {
  writeFileSync(enquiriesFile, JSON.stringify(enquiries, null, 2) + '\n');
}
function tokenFrom(request) {
  const value = request.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}
function requireAdmin(request, response, next) {
  if (!sessions.has(tokenFrom(request))) return response.status(401).json({ error: 'Sign in required.' });
  next();
}

app.post('/api/enquiries', (request, response) => {
  const { name, email, phone, fitness, notes, trek, batch, price } = request.body || {};
  if (![name, email, phone, trek, batch].every(value => typeof value === 'string' && value.trim())) {
    return response.status(400).json({ error: 'Name, email, phone, trek and batch are required.' });
  }
  const enquiry = {
    id: randomUUID(), name: name.trim(), email: email.trim(), phone: phone.trim(),
    fitness: typeof fitness === 'string' ? fitness : '', notes: typeof notes === 'string' ? notes.trim() : '',
    trek: trek.trim(), batch: batch.trim(), price: Number(price) || 0,
    status: 'New', createdAt: new Date().toISOString()
  };
  const enquiries = readEnquiries();
  enquiries.unshift(enquiry);
  saveEnquiries(enquiries);
  response.status(201).json({ enquiry });
});

app.post('/api/admin/login', (request, response) => {
  const email = process.env.ADMIN_EMAIL || 'admin@himroutes.in';
  const password = process.env.ADMIN_PASSWORD || 'change-me-before-deployment';
  if (request.body?.email !== email || request.body?.password !== password) {
    return response.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = randomUUID();
  sessions.set(token, { email, createdAt: Date.now() });
  response.json({ token });
});

app.get('/api/admin/enquiries', requireAdmin, (_request, response) => response.json({ enquiries: readEnquiries() }));
app.patch('/api/admin/enquiries/:id', requireAdmin, (request, response) => {
  const allowed = ['New', 'Confirmed', 'Closed'];
  if (!allowed.includes(request.body?.status)) return response.status(400).json({ error: 'Invalid status.' });
  const enquiries = readEnquiries();
  const enquiry = enquiries.find(item => item.id === request.params.id);
  if (!enquiry) return response.status(404).json({ error: 'Enquiry not found.' });
  enquiry.status = request.body.status;
  saveEnquiries(enquiries);
  response.json({ enquiry });
});

app.use(express.static(join(process.cwd(), 'dist')));
app.get('*', (_request, response) => response.sendFile(join(process.cwd(), 'dist', 'index.html')));
app.listen(port, () => console.log(`HimRoutes is running at http://localhost:${port}`));
