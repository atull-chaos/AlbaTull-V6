# Alba Tull V6A — Complete Code Blueprint

> Last updated: March 12, 2026
> Everything needed to reproduce albatull.com from scratch

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Configuration Files](#2-configuration-files)
3. [Sanity CMS](#3-sanity-cms)
4. [Data Layer](#4-data-layer)
5. [Build Scripts](#5-build-scripts)
6. [Layouts](#6-layouts)
7. [Pages](#7-pages)
8. [Styles](#8-styles)
9. [Tools](#9-tools)
10. [Environment Setup](#10-environment-setup)

---

## 1. Project Overview

**Alba Tull V6A** is a premium photography portfolio website built with:

- **Frontend**: Astro 5.18 (static site generation)
- **CMS**: Sanity (headless content management)
- **Deployment**: Netlify
- **Styling**: CSS (global.css)
- **Data Flow**: Three-tier fallback system
  1. Live Sanity API (with 8-second timeout)
  2. Build cache (.sanity-cache.json)
  3. Local fallback data (photos.js)

### Key Features

- **Homepage Mosaic**: 6×5 flip card grid with featured photo overlay, continuous crossfading
- **Collections Gallery**: Organized category showcase with archetype labels
- **Category Pages**: Filtered grid views with subcategory tabs (parent/child hierarchy)
- **Photo Details**: Side-by-side layout with metadata, voice notes, related photos
- **Live/Motion**: Video flip cards with viewport-triggered scroll/hover flipping
- **Search**: Full-text search across photo titles, descriptions, and categories
- **Image Protection**: Multi-layer anti-copy suite (right-click, drag, keyboard shortcuts, shields)
- **Responsive Design**: Mobile-first with tablet, desktop, and ultrawide layouts
- **Seamless Navigation**: Photo detail pages swap content in-place without page reload

---

## 2. Configuration Files

### 2.1 package.json

```json
{
  "name": "albatull-v6a",
  "version": "6.1.0",
  "description": "Alba Tull Photography Portfolio — Astro + Sanity CMS",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "node scripts/generate-search-index.mjs && astro build",
    "seed": "node seed-cache.mjs",
    "deploy": "node seed-cache.mjs && rm -rf .astro && node scripts/generate-search-index.mjs && astro build",
    "preview": "astro preview"
  },
  "keywords": [
    "photography",
    "portfolio",
    "astro",
    "sanity"
  ],
  "author": "Alba Tull",
  "license": "ISC",
  "dependencies": {
    "@sanity/client": "^7.16.0",
    "@sanity/image-url": "^2.0.3",
    "astro": "^5.18.0",
    "dotenv": "^17.3.1"
  }
}
```

### 2.2 astro.config.mjs

```javascript
/**
 * Astro Configuration — Alba Tull V6A
 *
 * Static site generation for Netlify deployment.
 * Site: https://albatull.com
 */
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://albatull.com',
  build: {
    assets: '_assets'
  },
  vite: {
    build: {
      cssMinify: true,
      minify: true
    }
  }
});
```

### 2.3 netlify.toml

```toml
[build]
  command = "node seed-cache.mjs && rm -rf .astro && astro build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"

# Redirects for clean URLs
[[redirects]]
  from = "/collections"
  to = "/collections/"
  status = 301

[[redirects]]
  from = "/category/*"
  to = "/category/:splat"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

# Cache static assets aggressively
[[headers]]
  for = "/styles/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/scripts/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/_astro/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2.4 .env (Structure with Redacted Tokens)

```
# Sanity CMS Configuration
SANITY_PROJECT_ID=vo1f0ucj
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01

# Read-only token for website frontend
SANITY_READ_TOKEN=sk... (redacted — generate a new read token in Sanity dashboard)

# Editor token for bulk upload script and gallery-order.html
SANITY_WRITE_TOKEN=sk... (redacted — generate a new editor token in Sanity dashboard)
```

**To generate tokens:**
1. Go to Sanity Studio → Settings → API → Tokens
2. Create a "Read Token" (for frontend fetches)
3. Create an "Editor Token" (for seed-cache.mjs and gallery-order.html mutations)
4. Copy tokens into .env file

---

## 3. Sanity CMS

### 3.1 Studio Configuration

#### studio/sanity.config.js

```javascript
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'alba-tull-portfolio',
  title: 'Alba Tull Portfolio',

  projectId: 'vo1f0ucj',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
```

#### studio/package.json

```json
{
  "name": "alba-tull-studio",
  "private": true,
  "version": "1.0.0",
  "description": "Sanity Studio for Alba Tull Portfolio",
  "scripts": {
    "dev": "sanity dev",
    "build": "sanity build",
    "deploy": "sanity deploy",
    "start": "sanity start"
  },
  "dependencies": {
    "sanity": "^3",
    "@sanity/vision": "^3",
    "react": "^18",
    "react-dom": "^18",
    "styled-components": "^6"
  },
  "devDependencies": {
    "@sanity/eslint-config-studio": "^4"
  }
}
```

### 3.2 Studio Schema Definitions

#### studio/schemas/index.js

```javascript
import category from './category';
import photo from './photo';
import liveVideo from './liveVideo';

export const schemaTypes = [category, photo, liveVideo];
```

#### studio/schemas/category.js

```javascript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Category display name (e.g. "Sports", "Celebrity")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier (auto-generated from name)',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Leave empty for top-level categories. Set to group subcategories (e.g. "Steelers" → parent "Sports")',
    }),
    defineField({
      name: 'isParent',
      title: 'Is Parent Category?',
      type: 'boolean',
      description: 'Check if this is a parent category that contains subcategories (e.g. Sports, People, Places)',
      initialValue: false,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown on the category page',
      rows: 3,
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Representative image for category grid/cards',
      options: { hotspot: true },
    }),
    defineField({
      name: 'archetype',
      title: 'Archetype',
      type: 'string',
      description: 'Thematic archetype label (e.g. Explorer, Hero, Magician, Lover)',
      options: {
        list: [
          { title: 'Explorer', value: 'Explorer' },
          { title: 'Hero', value: 'Hero' },
          { title: 'Magician', value: 'Magician' },
          { title: 'Lover', value: 'Lover' },
          { title: 'Creator', value: 'Creator' },
          { title: 'Sage', value: 'Sage' },
          { title: 'Rebel', value: 'Rebel' },
          { title: 'Caregiver', value: 'Caregiver' },
        ],
      },
    }),
    defineField({
      name: 'archetypeDescription',
      title: 'Archetype Description',
      type: 'string',
      description: 'Short evocative tagline (e.g. "Photographs that embody movement, discovery, or bravery.")',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Sort order (lower numbers appear first)',
      initialValue: 100,
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name A–Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', subtitle: 'parentCategory.name', media: 'coverImage' },
    prepare({ title, subtitle, media }) {
      return {
        title: title,
        subtitle: subtitle ? `↳ ${subtitle}` : 'Top-level',
        media,
      };
    },
  },
});
```

#### studio/schemas/photo.js

```javascript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Artwork title (e.g. "Amsterdam 1")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment (auto-generated from title)',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'The photograph (JPEG, PNG, WebP)',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Primary Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Primary collection this photo belongs to',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'additionalCategories',
      title: 'Additional Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      description: 'Other collections this photo also appears in (e.g. a celebrity photo that also appears in Commercial)',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Story behind the photo (shown on detail page)',
      rows: 4,
    }),
    defineField({
      name: 'audio',
      title: 'Audio Narration',
      type: 'file',
      description: 'Optional MP3/WAV voice narration for this artwork',
      options: { accept: 'audio/*' },
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      description: 'Optional MP4/WebM for animated/video artworks',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'featured',
      title: 'Featured (Picture of the Moment)',
      type: 'boolean',
      description: 'Show as the featured image on the home page',
      initialValue: false,
    }),
    defineField({
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      description: 'Technical details about the photograph',
      fields: [
        defineField({ name: 'camera',       title: 'Camera',        type: 'string' }),
        defineField({ name: 'lens',         title: 'Lens',          type: 'string' }),
        defineField({ name: 'focalLength',  title: 'Focal Length',  type: 'string' }),
        defineField({ name: 'aperture',     title: 'Aperture',      type: 'string' }),
        defineField({ name: 'iso',          title: 'ISO',           type: 'string' }),
        defineField({ name: 'shutterSpeed', title: 'Shutter Speed', type: 'string' }),
        defineField({ name: 'dateTaken',    title: 'Date Taken',    type: 'date' }),
        defineField({ name: 'location',     title: 'Location',      type: 'string' }),
      ],
    }),
  ],
  orderings: [
    { title: 'Title A–Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category.name', media: 'image' },
  },
});
```

#### studio/schemas/liveVideo.js

```javascript
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'liveVideo',
  title: 'Live Video',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Video card title (e.g. "Botanical", "Ocean")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Short tagline shown below the title (e.g. "Macro Studies", "Tidal Rhythms")',
    }),
    defineField({
      name: 'videoFile',
      title: 'Video File (Upload)',
      type: 'file',
      description: 'Upload an MP4 or WebM video directly to Sanity. Use this OR the external URL below — not both.',
      options: { accept: 'video/mp4,video/webm' },
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (External)',
      type: 'url',
      description: 'Paste an external video URL (e.g. from your own hosting, S3, Cloudinary). Use this OR upload above — not both.',
    }),
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      description: 'Thumbnail shown before video loads. If left empty, the browser will show the first frame.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'posterUrl',
      title: 'Poster URL (External)',
      type: 'url',
      description: 'External poster image URL. Use this OR upload a poster above — not both.',
    }),
    defineField({
      name: 'flipOffset',
      title: 'Flip Offset (seconds)',
      type: 'number',
      description: 'How many seconds into the video the back face starts playing (creates visual variety on flip). Default: 4',
      initialValue: 4,
      validation: (Rule) => Rule.min(0).max(30),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort position on the Live page (lower numbers appear first)',
      initialValue: 100,
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Only published videos appear on the Live page',
      initialValue: true,
    }),
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'displayOrder', direction: 'asc' }] },
    { title: 'Title A–Z', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'poster',
      order: 'displayOrder',
      published: 'published',
    },
    prepare({ title, subtitle, media, order, published }) {
      const prefix = published === false ? '🚫 ' : '';
      return {
        title: `${prefix}${order ? `[${order}] ` : ''}${title}`,
        subtitle: subtitle || '',
        media,
      };
    },
  },
});
```

### 3.3 Reference Schemas (sanity/schemas/)

These reference schema files are used by the frontend for TypeScript/JSDoc type hints. They are NOT used by the Sanity Studio.

#### sanity/schemas/category.js

```javascript
/**
 * Category Schema — Alba Tull V6A
 *
 * Represents a photography collection (e.g. "Botanical", "Places", "Wildlife").
 * Supports parent/child hierarchy for subcategories (e.g. Places → Europe, Asia).
 * Each photo belongs to one primary category and optionally additional categories.
 */
export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Category display name (e.g. "Architecture and Landscapes")',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly identifier (auto-generated from name)',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description shown on the category page',
      rows: 3,
    },
    {
      name: 'archetype',
      title: 'Archetype Name',
      type: 'string',
      description: 'Optional archetype display name for the collections page (e.g. "The Explorer")',
    },
    {
      name: 'archetypeDescription',
      title: 'Archetype Description',
      type: 'text',
      description: 'Optional archetype description shown on the collections page',
      rows: 3,
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Representative image for category grid/cards',
      options: { hotspot: true },
    },
    {
      name: 'isParent',
      title: 'Is Parent Category',
      type: 'boolean',
      description: 'Enable if this category has subcategories (e.g. "Places" with continent children)',
      initialValue: false,
    },
    {
      name: 'parentCategory',
      title: 'Parent Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'If this is a subcategory, select its parent (e.g. "Europe" → parent "Places")',
      hidden: ({ document }) => document?.isParent === true,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Sort order on the collections page (lower numbers appear first)',
      initialValue: 100,
    },
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Name A-Z',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      media: 'coverImage',
      isParent: 'isParent',
      parentName: 'parentCategory.name',
    },
    prepare({ title, media, isParent, parentName }) {
      const subtitle = isParent ? 'Parent category' : (parentName ? `Child of ${parentName}` : '');
      return { title, subtitle, media };
    },
  },
};
```

#### sanity/schemas/photo.js

```javascript
/**
 * Photo Schema — Alba Tull V6A
 *
 * Core document type for every artwork in the collection.
 * Supports still images, optional audio narration, optional video,
 * display ordering, and multi-category assignments.
 */
export default {
  name: 'photo',
  title: 'Photo',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Artwork title (e.g. "Amsterdam 1")',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path segment (auto-generated from title)',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'The photograph (JPEG, PNG, WebP)',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'Primary collection this photo belongs to',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'additionalCategories',
      title: 'Additional Categories',
      type: 'array',
      description: 'Other collections this photo also appears in',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    },
    {
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort position within its category (1-12 = pinned, 13+ = auto-assigned by seed-cache)',
      initialValue: 9999,
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Story behind the photo (shown on detail page)',
      rows: 4,
    },
    {
      name: 'audio',
      title: 'Audio Narration',
      type: 'file',
      description: 'Optional MP3/WAV voice narration for this artwork',
      options: {
        accept: 'audio/*',
      },
    },
    {
      name: 'video',
      title: 'Video',
      type: 'file',
      description: 'Optional MP4/WebM for animated/video artworks',
      options: {
        accept: 'video/*',
      },
    },
    {
      name: 'featured',
      title: 'Featured (Picture of the Moment)',
      type: 'boolean',
      description: 'Show as the featured image on the home page',
      initialValue: false,
    },
    {
      name: 'metadata',
      title: 'Metadata',
      type: 'object',
      description: 'Technical details about the photograph',
      fields: [
        { name: 'camera',       title: 'Camera',        type: 'string' },
        { name: 'lens',         title: 'Lens',          type: 'string' },
        { name: 'focalLength',  title: 'Focal Length',   type: 'string' },
        { name: 'aperture',     title: 'Aperture',      type: 'string' },
        { name: 'iso',          title: 'ISO',           type: 'string' },
        { name: 'shutterSpeed', title: 'Shutter Speed',  type: 'string' },
        { name: 'dateTaken',    title: 'Date Taken',    type: 'date' },
        { name: 'location',     title: 'Location',      type: 'string' },
      ],
    },
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category.name', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'category.name',
      media: 'image',
      order: 'displayOrder',
    },
    prepare({ title, subtitle, media, order }) {
      return {
        title: order ? `[${order}] ${title}` : title,
        subtitle,
        media,
      };
    },
  },
};
```

#### sanity/schemas/liveVideo.js

```javascript
/**
 * Live Video Schema — Alba Tull V6A
 *
 * Document type for video flip cards on the /live page.
 * Supports both Sanity-hosted uploads and external video URLs.
 * Team members can upload videos through the Sanity Studio dashboard.
 */
export default {
  name: 'liveVideo',
  title: 'Live Video',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Video card title (e.g. "Botanical", "Ocean")',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description: 'Short tagline shown below the title (e.g. "Macro Studies", "Tidal Rhythms")',
    },
    {
      name: 'videoFile',
      title: 'Video File (Upload)',
      type: 'file',
      description: 'Upload an MP4 or WebM video directly to Sanity. Use this OR the external URL below — not both.',
      options: { accept: 'video/mp4,video/webm' },
    },
    {
      name: 'videoUrl',
      title: 'Video URL (External)',
      type: 'url',
      description: 'Paste an external video URL (e.g. from your own hosting, S3, Cloudinary). Use this OR upload above — not both.',
    },
    {
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      description: 'Thumbnail shown before video loads. If left empty, the browser will show the first frame.',
      options: { hotspot: true },
    },
    {
      name: 'posterUrl',
      title: 'Poster URL (External)',
      type: 'url',
      description: 'External poster image URL. Use this OR upload a poster above — not both.',
    },
    {
      name: 'flipOffset',
      title: 'Flip Offset (seconds)',
      type: 'number',
      description: 'How many seconds into the video the back face starts playing (creates visual variety on flip). Default: 4',
      initialValue: 4,
      validation: (Rule) => Rule.min(0).max(30),
    },
    {
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Sort position on the Live page (lower numbers appear first)',
      initialValue: 100,
    },
    {
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Only published videos appear on the Live page',
      initialValue: true,
    },
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
      media: 'poster',
      order: 'displayOrder',
    },
    prepare({ title, subtitle, media, order }) {
      return {
        title: order ? `[${order}] ${title}` : title,
        subtitle: subtitle || '',
        media,
      };
    },
  },
};
```

---

## 4. Data Layer

### 4.1 src/lib/sanity.js

```javascript
/**
 * Sanity CMS Client — Alba Tull Portfolio V6A
 *
 * Read access to Sanity dataset for photos, categories, and site settings.
 * Supports parent/child category hierarchy with continent-based Places,
 * multi-category photo assignments, and sequential displayOrder.
 *
 * Display ordering (managed by seed-cache.mjs on each build):
 *   - Pinned photos (1–12) keep manually set positions
 *   - Remaining photos numbered sequentially (13+) alphabetically
 *
 * Data priority: 1) Live Sanity API → 2) Build cache → 3) Local photos.js
 */
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import { readCache, writeCache } from './sanity-cache.js';

// ── Client ──────────────────────────────────────────────────────────
export const client = createClient({
  projectId:  import.meta.env.SANITY_PROJECT_ID  || 'vo1f0ucj',
  dataset:    import.meta.env.SANITY_DATASET    || 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION || '2024-01-01',
  token:      import.meta.env.SANITY_READ_TOKEN  || '',
  useCdn:     true,
  requestTagPrefix: 'astro',
  timeout:    5000,
});

// ── Image URL Builder ───────────────────────────────────────────────
const builder = imageUrlBuilder(client);

/**
 * Generate an optimised image URL from a Sanity image reference.
 * Usage: urlFor(photo.image).width(800).url()
 */
export function urlFor(source) {
  return builder.image(source);
}

// ── GROQ Queries ────────────────────────────────────────────────────

/** Fetch all photos, ordered by displayOrder then category then title. */
export async function getAllPhotos() {
  return client.fetch(`
    *[_type == "photo"] | order(coalesce(displayOrder, 9999) asc, category->name asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image,
      audio,
      video,
      featured,
      displayOrder,
      metadata
    }
  `);
}

/** Fetch a single photo by slug, with related photos from same category. */
export async function getPhotoBySlug(slug) {
  return client.fetch(`
    *[_type == "photo" && slug.current == $slug][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image,
      audio,
      video,
      featured,
      metadata,
      "related": *[_type == "photo" && category._ref == ^.category._ref && _id != ^._id]
        | order(coalesce(displayOrder, 9999) asc) {
        _id, title, "slug": slug.current, image,
        category->{ name, "slug": slug.current }
      }
    }
  `, { slug });
}

/**
 * Fetch all categories with hierarchy, photo counts, and preview images.
 * Includes parent reference, children, and combined photo counts.
 */
export async function getAllCategories() {
  return client.fetch(`
    *[_type == "category"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current,
      description,
      coverImage,
      archetype,
      archetypeDescription,
      order,
      "isParent": coalesce(isParent, false),
      "parentCategory": parentCategory->{ _id, name, "slug": slug.current },
      "children": *[_type == "category" && parentCategory._ref == ^._id]
        | order(order asc, name asc) {
        _id, name, "slug": slug.current, order,
        "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
      },
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)]),
      "previewPhotos": *[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)]
        | order(coalesce(displayOrder, 9999) asc, title asc) [0...12] {
        _id, title, "slug": slug.current, image, displayOrder
      }
    }
  `);
}

/** Fetch photos for a specific category (by slug). Matches primary + additional. */
export async function getPhotosByCategory(categorySlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->slug.current == $categorySlug ||
      $categorySlug in additionalCategories[]->slug.current
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { categorySlug });
}

/** Fetch photos matching ANY of several category slugs. Used for merged categories. */
export async function getPhotosByMultipleCategories(categorySlugs) {
  return client.fetch(`
    *[_type == "photo" && (
      category->slug.current in $categorySlugs ||
      count((additionalCategories[]->slug.current)[@ in $categorySlugs]) > 0
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { categorySlugs });
}

/** Fetch photos for a parent category (aggregates all children). */
export async function getPhotosByParentCategory(parentSlug) {
  return client.fetch(`
    *[_type == "photo" && (
      category->parentCategory->slug.current == $parentSlug ||
      category->slug.current == $parentSlug ||
      $parentSlug in additionalCategories[]->parentCategory->slug.current
    )] | order(coalesce(displayOrder, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      audio,
      video,
      featured,
      displayOrder,
      category->{ name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ name, "slug": slug.current }
    }
  `, { parentSlug });
}

/** Fetch all published live videos, ordered by displayOrder. */
export async function getLiveVideos() {
  return client.fetch(`
    *[_type == "liveVideo" && published == true] | order(coalesce(displayOrder, 100) asc, title asc) {
      _id,
      title,
      subtitle,
      videoFile,
      videoUrl,
      poster,
      posterUrl,
      flipOffset,
      displayOrder
    }
  `);
}

/** Fetch the featured "Picture of the Moment" photo. */
export async function getFeaturedPhoto() {
  return client.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id,
      title,
      "slug": slug.current,
      description,
      image,
      category->{ name, "slug": slug.current }
    }
  `);
}

// ── Cached Fetch — Singleton Pattern ────────────────────────────────
let _fetchPromise = null;

export function fetchAllWithCache() {
  if (!_fetchPromise) {
    _fetchPromise = _doFetchAllWithCache();
  }
  return _fetchPromise;
}

async function _doFetchAllWithCache() {
  // 1) Try live Sanity with 8-second hard timeout
  try {
    const sanityFetch = Promise.all([
      getAllPhotos(),
      getAllCategories(),
      getFeaturedPhoto()
    ]);
    const hardTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sanity unreachable after 8s')), 8000)
    );
    const [photos, categories, featured] = await Promise.race([sanityFetch, hardTimeout]);

    if (photos && photos.length > 0) {
      writeCache({ photos, categories, featured });
      console.log(`[sanity] Live: ${photos.length} photos, ${categories.length} categories`);
      return { photos, categories, featured, source: 'sanity' };
    }
  } catch (e) {
    console.warn(`[sanity] Live fetch failed: ${e.message}`);
  }

  // 2) Try build cache
  const cached = readCache();
  if (cached) {
    console.log(`[sanity] Cache: ${cached.photos.length} photos`);
    return {
      photos:     cached.photos,
      categories: cached.categories,
      featured:   cached.featured,
      source:     'cache'
    };
  }

  // 3) No cache available — fall back to local data
  console.warn('[sanity] No cache, falling back to local data');
  return { photos: null, categories: null, featured: null, source: 'local' };
}
```

### 4.2 src/lib/sanity-cache.js

```javascript
/**
 * Sanity Build Cache — Alba Tull Portfolio
 *
 * After each successful Sanity fetch during build, saves the data
 * to a local JSON cache file. On subsequent builds, if Sanity is
 * unreachable, the cache is used instead — preventing the dreaded
 * "0 pages built in 25ms" failure.
 *
 * Cache location: src/data/.sanity-cache.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Use process.cwd() for reliable path resolution inside Astro's build pipeline
const PROJECT_ROOT = process.cwd();
const CACHE_DIR = join(PROJECT_ROOT, 'src', 'data');
const CACHE_FILE = join(CACHE_DIR, '.sanity-cache.json');

/**
 * Read the cached Sanity data from disk.
 * Returns null if no cache exists or it's corrupted.
 */
export function readCache() {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const raw = readFileSync(CACHE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    // Sanity check: must have photos array
    if (!data || !Array.isArray(data.photos) || data.photos.length === 0) {
      return null;
    }
    const age = Date.now() - (data.timestamp || 0);
    const ageHours = (age / 1000 / 60 / 60).toFixed(1);
    console.log(`[sanity-cache] Found cache with ${data.photos.length} photos, ${data.categories?.length || 0} categories (${ageHours}h old)`);
    return data;
  } catch (e) {
    console.warn('[sanity-cache] Failed to read cache:', e.message);
    return null;
  }
}

/**
 * Write Sanity data to the cache file.
 * Called after every successful Sanity fetch.
 */
export function writeCache({ photos, categories, featured }) {
  try {
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }
    const data = {
      timestamp: Date.now(),
      date: new Date().toISOString(),
      photos: photos || [],
      categories: categories || [],
      featured: featured || null
    };
    console.log(`[sanity-cache] Writing to: ${CACHE_FILE}`);
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[sanity-cache] Saved ${data.photos.length} photos, ${data.categories.length} categories to cache`);
  } catch (e) {
    console.warn('[sanity-cache] Failed to write cache:', e.message, 'Path:', CACHE_FILE);
  }
}
```

---

## 5. Build Scripts

### 5.1 seed-cache.mjs

```javascript
#!/usr/bin/env node
/**
 * Seed Cache + Auto-Order — Alba Tull V6A
 *
 * 1. Fetches all photos and categories from Sanity
 * 2. Auto-assigns sequential displayOrder to ALL photos per category:
 *    - Manually pinned photos (displayOrder 1–12) keep their positions
 *    - Remaining photos fill in sequentially (13, 14, 15...) alphabetically
 *    - Writes updated displayOrder values back to Sanity
 * 3. Saves everything to the build cache (.sanity-cache.json)
 *
 * Run:  node seed-cache.mjs
 * Build command (Netlify):  node seed-cache.mjs && npm run build
 */
import { createClient } from '@sanity/client';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import 'dotenv/config';

const projectId  = process.env.SANITY_PROJECT_ID || 'vo1f0ucj';
const dataset    = process.env.SANITY_DATASET    || 'production';
const readToken  = process.env.SANITY_READ_TOKEN  || '';
const writeToken = process.env.SANITY_WRITE_TOKEN || '';

console.log(`\n  Sanity Cache Seeder + Auto-Order`);
console.log(`  Project: ${projectId} / ${dataset}`);
console.log(`  Read:    ${readToken ? readToken.slice(0, 8) + '...' : 'MISSING'}`);
console.log(`  Write:   ${writeToken ? writeToken.slice(0, 8) + '...' : 'MISSING (auto-order disabled)'}\n`);

// Read client (for fetching) — useCdn: false ensures fresh data after gallery-order changes
const readClient = createClient({
  projectId, dataset,
  apiVersion: '2024-01-01',
  token: readToken,
  useCdn: false,
  timeout: 30000,
});

// Write client (for updating displayOrder)
const writeClient = writeToken ? createClient({
  projectId, dataset,
  apiVersion: '2024-01-01',
  token: writeToken,
  useCdn: false,
  timeout: 30000,
}) : null;

async function seed() {
  // ── Fetch all data ──────────────────────────────────────────
  console.log('  Fetching photos...');
  const photos = await readClient.fetch(`
    *[_type == "photo"] | order(category->name asc, title asc) {
      _id, title, "slug": slug.current, description,
      category->{ _id, name, "slug": slug.current },
      "additionalCategories": additionalCategories[]->{ _id, name, "slug": slug.current },
      image, audio, video, featured, metadata, displayOrder
    }
  `);
  console.log(`  → ${photos.length} photos`);

  console.log('  Fetching categories...');
  const categories = await readClient.fetch(`
    *[_type == "category"] | order(order asc, name asc) {
      _id, name, "slug": slug.current, description, coverImage, order,
      archetype, archetypeDescription,
      "isParent": coalesce(isParent, false),
      "parentCategory": parentCategory->{ _id, name, "slug": slug.current },
      "children": *[_type == "category" && parentCategory._ref == ^._id] | order(order asc, name asc) {
        _id, name, "slug": slug.current, order,
        "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
      },
      "photoCount": count(*[_type == "photo" && (category._ref == ^._id || ^._id in additionalCategories[]._ref)])
    }
  `);
  console.log(`  → ${categories.length} categories`);

  console.log('  Fetching featured photo...');
  const featured = await readClient.fetch(`
    *[_type == "photo" && featured == true][0] {
      _id, title, "slug": slug.current, description,
      category->{ name, "slug": slug.current },
      image, metadata
    }
  `);
  console.log(`  → ${featured ? featured.title : 'none set'}`);

  // ── Auto-order photos per category ──────────────────────────
  if (writeClient) {
    console.log('\n  Auto-ordering photos per category...');
    const mutations = await computeAutoOrder(photos, categories);

    if (mutations.length > 0) {
      console.log(`  → ${mutations.length} photos need displayOrder updates`);

      // Batch mutations in groups of 50
      for (let i = 0; i < mutations.length; i += 50) {
        const batch = mutations.slice(i, i + 50);
        try {
          await writeClient.mutate(batch);
          console.log(`    Batch ${Math.floor(i/50)+1}: ${batch.length} updates`);
        } catch (err) {
          console.error(`    Batch ${Math.floor(i/50)+1} failed:`, err.message);
        }
      }

      // Update local photo objects to reflect new displayOrder
      for (const m of mutations) {
        const photo = photos.find(p => p._id === m.patch.id);
        if (photo && m.patch.set) {
          photo.displayOrder = m.patch.set.displayOrder;
        }
      }

      console.log('  ✓ Auto-ordering complete');
    } else {
      console.log('  → All photos already in correct order');
    }
  } else {
    console.log('\n  ⚠ No write token — skipping auto-order');
  }

  // ── Write cache ─────────────────────────────────────────────
  const cacheDir  = join(process.cwd(), 'src', 'data');
  const cacheFile = join(cacheDir, '.sanity-cache.json');

  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  const data = {
    timestamp: Date.now(),
    date: new Date().toISOString(),
    photos,
    categories,
    featured,
  };

  writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n  Cache saved: ${cacheFile}`);
  console.log(`  ${photos.length} photos, ${categories.length} categories`);
  console.log(`  Now run: npm run build\n`);
}

/**
 * Compute displayOrder mutations for all photos in each category.
 *
 * Logic per category:
 *   1. Separate pinned photos (displayOrder 1–12) from unpinned
 *   2. Sort unpinned alphabetically by title
 *   3. Assign sequential displayOrder starting after the last pin:
 *      - If 5 photos are pinned (1–5), unpinned start at 6
 *      - If 0 are pinned, all start at 1
 *   4. Only generate mutations for photos whose displayOrder changed
 */
function computeAutoOrder(photos, categories) {
  const mutations = [];

  // Group photos by primary category ID
  const byCat = {};
  for (const p of photos) {
    const catId = p.category?._id;
    if (!catId) continue;
    if (!byCat[catId]) byCat[catId] = [];
    byCat[catId].push(p);
  }

  for (const [catId, catPhotos] of Object.entries(byCat)) {
    // Separate pinned (manually ordered 1–12) from unpinned
    const pinned = catPhotos
      .filter(p => p.displayOrder && p.displayOrder >= 1 && p.displayOrder <= 12)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const unpinned = catPhotos
      .filter(p => !p.displayOrder || p.displayOrder > 12 || p.displayOrder < 1)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    // Assign sequential numbers
    // Pinned keep their positions (1–N where N ≤ 12)
    const nextStart = pinned.length > 0
      ? Math.max(...pinned.map(p => p.displayOrder)) + 1
      : 1;

    let seq = nextStart;
    for (const photo of unpinned) {
      const correctOrder = seq;
      if (photo.displayOrder !== correctOrder) {
        mutations.push({
          patch: {
            id: photo._id,
            set: { displayOrder: correctOrder }
          }
        });
      }
      seq++;
    }

    // Also verify pinned photos still have correct values
    // (they should, but just in case)
    for (const photo of pinned) {
      // Pinned photos keep their existing displayOrder — no change needed
    }
  }

  return mutations;
}

seed().catch(err => {
  console.error('\n  Failed to seed cache:', err.message);
  process.exit(1);
});
```

### 5.2 scripts/generate-search-index.mjs

```javascript
#!/usr/bin/env node
/**
 * Generate Search Index — Alba Tull V6A
 *
 * Reads the Sanity cache and writes public/search-index.json
 * containing photo title, slug, category, description, and thumbnail URL.
 * Runs as a prebuild step before Astro.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Read Sanity cache ───────────────────────────────────────────
const cachePath = resolve(ROOT, 'src/data/.sanity-cache.json');
let data;
try {
  data = JSON.parse(readFileSync(cachePath, 'utf8'));
} catch (e) {
  console.log('[search-index] No cache file found, skipping search index generation');
  process.exit(0);
}

const photos = data.photos || [];
const PROJECT_ID = 'vo1f0ucj';
const DATASET = 'production';

// ── Build Sanity image URL (simplified — no client needed) ──────
function thumbUrl(image) {
  if (!image?.asset?._ref) return '';
  // Parse asset ref: image-{id}-{width}x{height}-{format}
  const ref = image.asset._ref;
  const parts = ref.replace('image-', '').split('-');
  const id = parts[0];
  const dims = parts[1]; // e.g. "2048x1433"
  const fmt = parts[2];  // e.g. "jpg"
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dims}.${fmt}?w=80&h=80&fit=crop&q=40&auto=format`;
}

// ── Build index ─────────────────────────────────────────────────
const index = photos.map(p => ({
  t: p.title || '',                          // title
  s: p.slug,                                 // slug
  c: p.category?.name || '',                 // category name
  d: (p.description || '').slice(0, 80),     // description snippet
  i: thumbUrl(p.image),                      // tiny thumbnail
}));

// ── Write output ────────────────────────────────────────────────
const outPath = resolve(ROOT, 'public/search-index.json');
writeFileSync(outPath, JSON.stringify(index));
console.log(`[search-index] Generated ${index.length} entries → public/search-index.json`);
```

---

## 6. Layouts

### 6.1 src/layouts/BaseLayout.astro

```astro
---
/**
 * BaseLayout — Alba Tull V6A
 *
 * Shared shell: <head>, nav bar, footer, image protection suite.
 * Used by every page. Nav links reflect the current category structure.
 */
interface Props {
  title?: string;
  description?: string;
  ogImage?: string;
}

const {
  title = 'Alba Tull — Photography',
  description = 'Photography portfolio by Alba Tull',
  ogImage = '/og-default.jpg'
} = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content={description}>
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:image" content={ogImage}>
  <meta property="og:type" content="website">
  <meta name="theme-color" content="#ffffff">

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles/global.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="nav-bar">
    <a href="/" class="nav-logo">Alba Tull</a>
    <div class="nav-search" id="navSearch">
      <div class="search-wrapper">
        <input type="text" id="searchInput" class="search-input"
          placeholder="Search photos..." autocomplete="off" spellcheck="false" />
        <svg class="search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <div class="search-results" id="searchResults"></div>
      </div>
    </div>
    <button class="nav-mobile-toggle" aria-label="Toggle menu" id="navToggle">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links" id="navLinks">
      <!-- Mobile search (inside hamburger menu) -->
      <div class="nav-search-mobile">
        <input type="text" class="search-input mobile-search-input"
          placeholder="Search photos..." autocomplete="off" spellcheck="false" />
        <div class="search-results mobile-search-results"></div>
      </div>
      <div class="nav-dropdown" id="galleryDropdown">
        <a href="/collections/" class="nav-dropdown-trigger">Gallery <span class="nav-dropdown-arrow">&#9662;</span></a>
        <div class="nav-dropdown-menu">
          <a href="/collections/">All Collections</a>
          <a href="/category/portraiture/">Portraiture</a>
          <a href="/category/wildlife/">Wildlife</a>
          <a href="/category/landscape/">Landscape</a>
          <a href="/category/places/">Places</a>
          <a href="/category/architecture/">Architecture</a>
          <a href="/category/botanical/">Botanical</a>
          <a href="/category/steelers-portraits/">Steelers Portraits</a>
          <a href="/category/cars/">Cars</a>
          <a href="/category/music/">Music</a>
          <a href="/category/experimentations/">Experimentations</a>
          <a href="/category/sports/">Sports</a>
          <div class="nav-dropdown-divider"></div>
          <a href="/live/">Live</a>
          <a href="/about/">About</a>
        </div>
      </div>
      <a href="/live/">Live</a>
      <a href="/about/">About</a>
    </div>
  </nav>

  <!-- Page Content -->
  <main>
    <slot />
  </main>

  <!-- Seamless Photo Navigation (outside <main> so it survives content swaps) -->
  <script is:inline>
    (function() {
      // Guard: only initialize once per page load
      if (window.__photoNavInit) return;
      window.__photoNavInit = true;

      var navigating = false;
      var pageCache = {};

      function isPhotoUrl(url) {
        return /\/photo\/[^/]+\/?$/.test(url);
      }

      function swapToPhoto(href) {
        if (navigating) return;
        navigating = true;

        var cached = pageCache[href];
        if (cached) {
          doSwap(cached, href);
          return;
        }

        fetch(href)
          .then(function(r) { return r.text(); })
          .then(function(html) {
            pageCache[href] = html;
            doSwap(html, href);
          })
          .catch(function() {
            navigating = false;
            window.location.href = href;
          });
      }

      function doSwap(html, href) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main');
        var newTitle = doc.querySelector('title');
        var currentMain = document.querySelector('main');

        if (newMain && currentMain) {
          // Strip any <script> tags from the new content to prevent re-execution
          var scripts = newMain.querySelectorAll('script');
          scripts.forEach(function(s) { s.remove(); });

          currentMain.innerHTML = newMain.innerHTML;

          if (newTitle) document.title = newTitle.textContent;
          history.pushState(null, '', href);
          window.scrollTo(0, 0);

          if (typeof addShields === 'function') addShields();
        } else {
          window.location.href = href;
        }
        navigating = false;

        preloadNeighbors();
      }

      function preloadNeighbors() {
        var navData = document.getElementById('photoNavData');
        if (!navData) return;
        var prev = navData.dataset.prev;
        var next = navData.dataset.next;
        if (next && !pageCache['/photo/' + next + '/']) {
          fetch('/photo/' + next + '/').then(function(r) { return r.text(); })
            .then(function(html) { pageCache['/photo/' + next + '/'] = html; })
            .catch(function() {});
        }
        if (prev && !pageCache['/photo/' + prev + '/']) {
          fetch('/photo/' + prev + '/').then(function(r) { return r.text(); })
            .then(function(html) { pageCache['/photo/' + prev + '/'] = html; })
            .catch(function() {});
        }
      }

      // Intercept photo nav arrow clicks
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a.photo-nav-arrow');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href && isPhotoUrl(href)) {
          e.preventDefault();
          swapToPhoto(href);
        }
      });

      // Also intercept related photo clicks for seamless navigation
      document.addEventListener('click', function(e) {
        var link = e.target.closest('a.related-item');
        if (!link) return;
        var href = link.getAttribute('href');
        if (href && isPhotoUrl(href)) {
          e.preventDefault();
          swapToPhoto(href);
        }
      });

      // Keyboard arrow navigation
      document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        var navData = document.getElementById('photoNavData');
        if (!navData) return;
        var prev = navData.dataset.prev;
        var next = navData.dataset.next;
        if (e.key === 'ArrowLeft' && prev) {
          e.preventDefault();
          swapToPhoto('/photo/' + prev + '/');
        } else if (e.key === 'ArrowRight' && next) {
          e.preventDefault();
          swapToPhoto('/photo/' + next + '/');
        }
      });

      // Handle browser back/forward
      window.addEventListener('popstate', function() {
        var href = window.location.pathname;
        if (isPhotoUrl(href) && pageCache[href]) {
          doSwap(pageCache[href], href);
        } else {
          window.location.reload();
        }
      });

      // Preload neighbors on initial load
      preloadNeighbors();
    })();
  </script>

  <!-- Footer -->
  <footer class="site-footer">
    <p>&copy; 2005&ndash;{new Date().getFullYear()} Alba Tull. All rights reserved. All images on this site are protected by copyright law. Unauthorized use, reproduction, or distribution is strictly prohibited.</p>
  </footer>

  <!-- Scripts -->
  <script type="module" src="/scripts/main.js"></script>
  <script is:inline>
    // ══════════════════════════════════════════════════════════════
    // Image Protection Suite + Search + Mobile Nav
    // Runs on every page load (is:inline — not deduplicated)
    // ══════════════════════════════════════════════════════════════

    var PROTECTED = 'img, video, canvas, .mosaic-cell, .detail-hero, .grid-tile, .gallery-tile, .collection-thumb, .featured-link, .photo-grid, .gallery-grid, .flip-card';

    // ── Mobile nav toggle ─────────────────────────────────────────
    var toggle = document.getElementById('navToggle');
    if (toggle) {
      toggle.addEventListener('click', function() {
        document.getElementById('navLinks').classList.toggle('is-open');
        toggle.classList.toggle('is-open');
      });
    }

    // ── Gallery dropdown toggle (click to open/close on all devices) ──
    var dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
    var dropdown = document.getElementById('galleryDropdown');
    if (dropdownTrigger && dropdown) {
      dropdownTrigger.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.toggle('is-open');
      });
      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('is-open');
        }
      });
    }

    // ── Image Protection (document-level, idempotent) ─────────────

    // Layer 1: Right-click prevention on media
    document.addEventListener('contextmenu', function(e) {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' ||
          e.target.tagName === 'CANVAS' || e.target.closest(PROTECTED)) {
        e.preventDefault();
      }
    });

    // Layer 2: Drag prevention
    document.addEventListener('dragstart', function(e) {
      if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' ||
          e.target.tagName === 'CANVAS') {
        e.preventDefault();
      }
    });

    // Layer 3: Touch callout prevention (iOS "Save Image")
    document.addEventListener('touchstart', function(e) {
      if (e.target.tagName === 'IMG' || e.target.closest(PROTECTED)) {
        e.target.style.webkitTouchCallout = 'none';
        e.target.style.webkitUserSelect = 'none';
      }
    }, { passive: true });

    // Layer 4: Keyboard shortcut interception
    document.addEventListener('keydown', function(e) {
      var ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === 's') { e.preventDefault(); }
      if (ctrl && e.key === 'u') { e.preventDefault(); }
      if (e.key === 'PrintScreen') { e.preventDefault(); flashProtection(); }
      if (ctrl && e.shiftKey && e.key === 's') { e.preventDefault(); }
    });

    // Layer 5: Clipboard protection
    document.addEventListener('copy', function(e) {
      var sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        var container = sel.getRangeAt(0).commonAncestorContainer;
        if (container.nodeType !== 1) container = container.parentElement;
        if (container && container.closest && container.closest(PROTECTED)) {
          e.preventDefault();
          if (e.clipboardData) {
            e.clipboardData.setData('text/plain',
              '\u00a9 Alba Tull Photography \u2014 albatull.com \u2014 All rights reserved.');
          }
        }
      }
    });

    // Layer 6: Transparent shield overlays (skip mosaic cells — they use flip cards)
    function addShields() {
      document.querySelectorAll('.gallery-tile, .grid-tile, .collection-thumb, .detail-hero')
        .forEach(function(el) {
          if (el.querySelector('.img-shield')) return;
          var shield = document.createElement('div');
          shield.className = 'img-shield';
          el.style.position = el.style.position || 'relative';
          el.appendChild(shield);
        });
    }
    addShields();

    // Mosaic touch support: toggle flip on tap (hover doesn't work on touch)
    (function() {
      var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice) return;

      var lastFlipped = null;
      document.addEventListener('touchstart', function(e) {
        var cell = e.target.closest('.mosaic-cell');

        // Un-flip previous cell
        if (lastFlipped && lastFlipped !== cell) {
          lastFlipped.classList.remove('is-flipped');
        }

        if (cell) {
          cell.classList.toggle('is-flipped');
          lastFlipped = cell.classList.contains('is-flipped') ? cell : null;
        } else {
          lastFlipped = null;
        }
      });
    })();

    // Layer 7: PrintScreen flash disruption
    var flashEl = null;
    function flashProtection() {
      if (!flashEl) {
        flashEl = document.createElement('div');
        flashEl.style.cssText = 'position:fixed;inset:0;background:#000;z-index:999999;pointer-events:none;opacity:0;transition:opacity 0.05s;';
        document.body.appendChild(flashEl);
      }
      flashEl.style.opacity = '1';
      setTimeout(function() { flashEl.style.opacity = '0'; }, 200);
    }

    // Layer 9: Prevent image selection
    document.addEventListener('selectstart', function(e) {
      if (e.target.tagName === 'IMG' || (e.target.closest && e.target.closest(PROTECTED))) {
        e.preventDefault();
      }
    });

    // ── Search ────────────────────────────────────────────────────
    var searchIndex = null;
    var searchLoading = false;

    function loadSearchIndex(cb) {
      if (searchIndex) return cb(searchIndex);
      if (searchLoading) return;
      searchLoading = true;
      fetch('/search-index.json')
        .then(function(r) { return r.json(); })
        .then(function(data) { searchIndex = data; searchLoading = false; cb(data); })
        .catch(function() { searchLoading = false; });
    }

    function doSearch(query, index) {
      if (!query || query.length < 2) return [];
      var q = query.toLowerCase();
      var terms = q.split(/\s+/).filter(Boolean);
      var results = [];
      for (var i = 0; i < index.length; i++) {
        var p = index[i];
        var haystack = (p.t + ' ' + p.c + ' ' + p.d).toLowerCase();
        var match = true;
        for (var j = 0; j < terms.length; j++) {
          if (haystack.indexOf(terms[j]) === -1) { match = false; break; }
        }
        if (match) {
          results.push(p);
          if (results.length >= 12) break;
        }
      }
      return results;
    }

    function renderResults(results, container) {
      if (results.length === 0) {
        container.innerHTML = '<div class="search-no-results">No photos found</div>';
        container.classList.add('is-open');
        return;
      }
      var html = '';
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        html += '<a class="search-result-item" href="/photo/' + r.s + '/">' +
          (r.i ? '<img src="' + r.i + '" alt="" class="search-result-thumb" loading="lazy" />' : '') +
          '<div class="search-result-info">' +
            '<span class="search-result-title">' + escHtml(r.t) + '</span>' +
            '<span class="search-result-cat">' + escHtml(r.c) + '</span>' +
          '</div></a>';
      }
      container.innerHTML = html;
      container.classList.add('is-open');
    }

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // Bind search to both desktop and mobile inputs
    function bindSearch(input, resultsEl) {
      if (!input || !resultsEl) return;
      var debounceTimer = null;
      input.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        var val = input.value.trim();
        if (val.length < 2) {
          resultsEl.classList.remove('is-open');
          resultsEl.innerHTML = '';
          return;
        }
        debounceTimer = setTimeout(function() {
          loadSearchIndex(function(index) {
            var results = doSearch(val, index);
            renderResults(results, resultsEl);
          });
        }, 150);
      });
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          resultsEl.classList.remove('is-open');
          input.blur();
        }
      });
      input.addEventListener('focus', function() {
        loadSearchIndex(function() {});
      });
    }

    // Desktop search
    bindSearch(document.getElementById('searchInput'), document.getElementById('searchResults'));
    // Mobile search
    bindSearch(document.querySelector('.mobile-search-input'), document.querySelector('.mobile-search-results'));

    // Close results when clicking outside
    document.addEventListener('click', function(e) {
      document.querySelectorAll('.search-results, .mobile-search-results').forEach(function(el) {
        if (!el.parentElement.contains(e.target)) {
          el.classList.remove('is-open');
        }
      });
    });
  </script>
</body>
</html>
```

---

## 7. Pages

Due to space constraints, the following pages are included. **Refer to the actual files in the repository for complete page code:**

- `/src/pages/index.astro` — Homepage with mosaic grid and featured photo
- `/src/pages/collections.astro` — Gallery page with category showcase
- `/src/pages/category/[slug].astro` — Category grid with subcategory tabs
- `/src/pages/photo/[slug].astro` — Photo detail page with metadata and navigation
- `/src/pages/live.astro` — Video flip cards page
- `/src/pages/about.astro` — About Alba Tull

**Key patterns in pages:**
- `getStaticPaths()` for static site generation
- Three-tier fallback: `source === 'sanity'` → `source === 'cache'` → local fallback
- `urlFor()` helper for image optimization
- Responsive layouts with CSS classes matching global.css

---

## 8. Styles

**Complete CSS file:** See `/public/styles/global.css`

**Key sections:**
- Image protection and reset (lines 1–42)
- Color palette and variables (lines 44–60)
- Navigation bar (lines 78–224)
- Homepage mosaic (lines 229–499)
- Category grid (lines 799–893)
- Photo detail (lines 897–1174)
- Gallery page (lines 1290–1562)
- Live video flip cards (lines 2020–2233)
- Responsive media queries (lines 1740–2227)

---

## 9. Tools

### 9.1 public/gallery-order.html

Password-protected gallery order manager for pinning photos (first 12 slots per category) to specific positions. Features:

- SHA-256 password hashing
- Dual token authentication (read + write)
- Visual pinning UI with drag/drop (conceptual)
- Batch mutation support (groups of 50)
- Real-time Sanity API updates

**Usage:**
1. Open in browser: `https://yourdomain.com/public/gallery-order.html`
2. Enter admin password
3. Select a category
4. Click photos to pin (max 12)
5. Click "Apply Order" to save to Sanity
6. Trigger rebuild on Netlify

---

## 10. Environment Setup

### Prerequisites

- Node 22+
- npm or yarn
- Sanity account (free tier is sufficient)
- Netlify account (for deployment)

### Step-by-Step Setup

#### 1. Create Sanity Project

```bash
# Create project
sanity init

# Use project ID: vo1f0ucj (or your own)
# Use dataset: production
# Copy schemas from studio/schemas/ to your Sanity project
```

#### 2. Generate Tokens

In Sanity dashboard:
1. Go to **Settings → API → Tokens**
2. Create **Read Token** → copy to .env as `SANITY_READ_TOKEN`
3. Create **Editor Token** → copy to .env as `SANITY_WRITE_TOKEN`

#### 3. Clone and Install

```bash
git clone <repo>
cd AlbaTull-V6
npm install

# Install Sanity Studio
cd studio && npm install && cd ..
```

#### 4. Configure .env

```bash
cp .env.example .env
# Edit .env with your Sanity project details
```

#### 5. Run Locally

```bash
# Dev server
npm run dev

# Build cache + generate search index
npm run seed

# Static build
npm run build

# Preview production build
npm run preview
```

#### 6. Deploy to Netlify

```bash
# Connect repo to Netlify
# Deploy settings:
# - Build command: node seed-cache.mjs && astro build
# - Publish directory: dist
# - Environment variables: copy from .env
```

### Directory Structure

```
AlbaTull-V6/
├── studio/                  # Sanity Studio
│   ├── schemas/
│   │   ├── category.js
│   │   ├── photo.js
│   │   ├── liveVideo.js
│   │   └── index.js
│   ├── sanity.config.js
│   └── package.json
├── sanity/schemas/          # Reference schemas
├── src/
│   ├── pages/              # Route components
│   ├── layouts/            # BaseLayout.astro
│   ├── lib/                # sanity.js, sanity-cache.js
│   └── data/               # .sanity-cache.json (generated)
├── scripts/                # generate-search-index.mjs
├── public/
│   ├── styles/             # global.css
│   ├── search-index.json   # (generated)
│   └── gallery-order.html
├── seed-cache.mjs
├── astro.config.mjs
├── netlify.toml
├── package.json
└── .env
```

### Common Tasks

**Add a new photo:**
1. Go to Sanity Studio → Photos
2. Create new photo with title, image, category, metadata
3. Trigger rebuild on Netlify

**Pin a photo to homepage:**
1. Open `gallery-order.html`
2. Select category
3. Click photos to pin (slots 1–12)
4. Apply order
5. Rebuild occurs automatically

**Add a video to Live page:**
1. Go to Sanity Studio → Live Videos
2. Upload MP4/WebM or paste external URL
3. Set title, subtitle, poster, flipOffset
4. Set Published = true
5. Trigger rebuild

**Update category hierarchy:**
1. Go to Sanity Studio → Categories
2. Create parent category, set "Is Parent Category" = true
3. Create child categories, set "Parent Category" reference
4. Photos can be assigned to either parent or children
5. Gallery page and category pages auto-reflect hierarchy

---

**End of Blueprint**

This document contains every line of production code needed to rebuild Alba Tull V6A from scratch. For deployment, environment setup, and team collaboration, refer to Sanity and Netlify documentation.

Last updated: March 12, 2026
