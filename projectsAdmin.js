// routes/projectsAdmin.js — Developer-only project management endpoints.
// Every route here requires a valid session token (see middleware/auth.js).

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const { requireDevAuth } = require('../middleware/auth');
const { readAll, writeAll } = require('../db');

router.use(requireDevAuth);

function makeUniqueSlug(name, projects, excludeId) {
  const base = slugify(name || 'project', { lower: true, strict: true }) || 'project';
  let slug = base;
  let i = 2;
  while (projects.some((p) => p.slug === slug && p.id !== excludeId)) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

const REQUIRED_FIELDS = ['projectName', 'siteName', 'projectCategory', 'projectStatus'];

function validate(body) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || String(body[field]).trim() === '') {
      errors.push(`${field} is required.`);
    }
  }
  if (body.projectStatus && !['Completed', 'Ongoing', 'Upcoming'].includes(body.projectStatus)) {
    errors.push('projectStatus must be Completed, Ongoing, or Upcoming.');
  }
  if (body.googleMapLink && !/^https?:\/\//i.test(body.googleMapLink)) {
    errors.push('googleMapLink must be a valid URL.');
  }
  if (body.numberOfWorkingDays && isNaN(Number(body.numberOfWorkingDays))) {
    errors.push('numberOfWorkingDays must be a number.');
  }
  return errors;
}

// ---- List (with search/filter, includes drafts) ----
router.get('/', (req, res) => {
  const { search = '', category = '', status = '', published = '' } = req.query;
  let projects = readAll();

  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter((p) =>
      [p.projectName, p.siteName, p.clientName, p.siteLocation]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }
  if (category) projects = projects.filter((p) => p.projectCategory === category);
  if (status) projects = projects.filter((p) => p.projectStatus === status);
  if (published === 'true') projects = projects.filter((p) => p.isPublished);
  if (published === 'false') projects = projects.filter((p) => !p.isPublished);

  projects.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  res.json({ projects, total: projects.length });
});

// ---- Dashboard stats ----
router.get('/stats/summary', (req, res) => {
  const projects = readAll();
  res.json({
    total: projects.length,
    published: projects.filter((p) => p.isPublished).length,
    drafts: projects.filter((p) => !p.isPublished).length,
    featured: projects.filter((p) => p.isFeatured).length,
    completed: projects.filter((p) => p.projectStatus === 'Completed').length,
    ongoing: projects.filter((p) => p.projectStatus === 'Ongoing').length,
    upcoming: projects.filter((p) => p.projectStatus === 'Upcoming').length,
    totalWorkingDays: projects.reduce((sum, p) => sum + (Number(p.numberOfWorkingDays) || 0), 0),
  });
});

// ---- Get one ----
router.get('/:id', (req, res) => {
  const project = readAll().find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project });
});

// ---- Create ----
router.post('/', async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const projects = readAll();
  const now = new Date().toISOString();

  const project = {
    id: uuidv4(),
    slug: makeUniqueSlug(req.body.projectName, projects),
    projectName: req.body.projectName,
    siteName: req.body.siteName,
    clientName: req.body.clientName || '',
    siteLocation: req.body.siteLocation || '',
    googleMapLink: req.body.googleMapLink || '',
    projectCategory: req.body.projectCategory,
    projectStatus: req.body.projectStatus,
    siteCondition: req.body.siteCondition || '',
    projectDescription: req.body.projectDescription || '',
    shortDescription: req.body.shortDescription || (req.body.projectDescription || '').slice(0, 160),
    scopeOfWork: req.body.scopeOfWork || '',
    numberOfWorkingDays: Number(req.body.numberOfWorkingDays) || 0,
    startDate: req.body.startDate || '',
    completionDate: req.body.completionDate || '',
    teamMembers: req.body.teamMembers || [],
    safetyCertifications: req.body.safetyCertifications || [],
    equipmentUsed: req.body.equipmentUsed || [],
    beforeImages: req.body.beforeImages || [],
    duringImages: req.body.duringImages || [],
    afterImages: req.body.afterImages || [],
    featuredImage: req.body.featuredImage || '',
    galleryImages: req.body.galleryImages || [],
    videos: req.body.videos || [],
    pdfReport: req.body.pdfReport || '',
    customerTestimonial: req.body.customerTestimonial || '',
    displayOrder: req.body.displayOrder != null ? Number(req.body.displayOrder) : projects.length + 1,
    isFeatured: !!req.body.isFeatured,
    isPublished: !!req.body.isPublished,
    createdAt: now,
    updatedAt: now,
  };

  projects.push(project);
  await writeAll(projects);
  res.status(201).json({ project });
});

// ---- Update ----
router.put('/:id', async (req, res) => {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  const errors = validate({ ...projects[idx], ...req.body });
  if (errors.length) return res.status(400).json({ errors });

  const existing = projects[idx];
  const nameChanged = req.body.projectName && req.body.projectName !== existing.projectName;
  const slug = nameChanged ? makeUniqueSlug(req.body.projectName, projects, existing.id) : existing.slug;

  projects[idx] = {
    ...existing,
    ...req.body,
    id: existing.id,
    slug,
    updatedAt: new Date().toISOString(),
  };

  await writeAll(projects);
  res.json({ project: projects[idx] });
});

// ---- Delete ----
router.delete('/:id', async (req, res) => {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  const [removed] = projects.splice(idx, 1);
  await writeAll(projects);
  res.json({ deleted: removed.id });
});

// ---- Publish / Unpublish ----
router.patch('/:id/publish', async (req, res) => {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  projects[idx].isPublished = req.body.isPublished !== undefined ? !!req.body.isPublished : !projects[idx].isPublished;
  projects[idx].updatedAt = new Date().toISOString();
  await writeAll(projects);
  res.json({ project: projects[idx] });
});

// ---- Toggle featured ----
router.patch('/:id/feature', async (req, res) => {
  const projects = readAll();
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  projects[idx].isFeatured = req.body.isFeatured !== undefined ? !!req.body.isFeatured : !projects[idx].isFeatured;
  projects[idx].updatedAt = new Date().toISOString();
  await writeAll(projects);
  res.json({ project: projects[idx] });
});

// ---- Duplicate ----
router.post('/:id/duplicate', async (req, res) => {
  const projects = readAll();
  const source = projects.find((p) => p.id === req.params.id);
  if (!source) return res.status(404).json({ error: 'Project not found.' });

  const now = new Date().toISOString();
  const copy = {
    ...source,
    id: uuidv4(),
    projectName: source.projectName + ' (Copy)',
    slug: makeUniqueSlug(source.projectName + '-copy', projects),
    isPublished: false,
    displayOrder: projects.length + 1,
    createdAt: now,
    updatedAt: now,
  };
  projects.push(copy);
  await writeAll(projects);
  res.status(201).json({ project: copy });
});

// ---- Reorder (drag & drop) ----
router.post('/reorder', async (req, res) => {
  const { order } = req.body; // [{ id, displayOrder }, ...]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array.' });

  const projects = readAll();
  const map = new Map(order.map((o) => [o.id, o.displayOrder]));
  projects.forEach((p) => {
    if (map.has(p.id)) p.displayOrder = map.get(p.id);
  });

  await writeAll(projects);
  res.json({ success: true });
});

module.exports = router;
