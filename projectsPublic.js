// routes/projectsPublic.js — Public-facing, read-only project endpoints.
// Visitors can only ever see projects where isPublished === true.

const express = require('express');
const router = express.Router();
const { readAll } = require('../db');

function toPublicShape(p) {
  // Strip nothing sensitive lives on a project, but keep the shape explicit
  // and stable so the public site has a predictable contract.
  return p;
}

router.get('/', (req, res) => {
  const { search = '', category = '', status = '', location = '' } = req.query;
  let projects = readAll().filter((p) => p.isPublished);

  if (search) {
    const q = search.toLowerCase();
    projects = projects.filter((p) =>
      [p.projectName, p.siteName, p.clientName, p.siteLocation, p.shortDescription]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(q))
    );
  }
  if (category) projects = projects.filter((p) => p.projectCategory === category);
  if (status) projects = projects.filter((p) => p.projectStatus === status);
  if (location) projects = projects.filter((p) => p.siteLocation === location);

  projects.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

  res.json({ projects: projects.map(toPublicShape), total: projects.length });
});

router.get('/filters', (req, res) => {
  const published = readAll().filter((p) => p.isPublished);
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  res.json({
    categories: uniq(published.map((p) => p.projectCategory)),
    statuses: uniq(published.map((p) => p.projectStatus)),
    locations: uniq(published.map((p) => p.siteLocation)),
  });
});

router.get('/:slug', (req, res) => {
  const projects = readAll();
  const project = projects.find((p) => p.slug === req.params.slug && p.isPublished);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const published = projects.filter((p) => p.isPublished && p.id !== project.id);
  const sameCategory = published.filter((p) => p.projectCategory === project.projectCategory);
  const related = (sameCategory.length ? sameCategory : published)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .slice(0, 3);

  const orderedPublished = published
    .concat(project)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  const idx = orderedPublished.findIndex((p) => p.id === project.id);
  const prev = orderedPublished[(idx - 1 + orderedPublished.length) % orderedPublished.length];
  const next = orderedPublished[(idx + 1) % orderedPublished.length];

  res.json({
    project: toPublicShape(project),
    related,
    prev: prev?.id === project.id ? null : prev,
    next: next?.id === project.id ? null : next,
  });
});

module.exports = router;
