/**
 * Photo Schema — Alba Tull Portfolio
 *
 * Core document type for every artwork in the collection.
 * Supports still images, optional audio narration, and optional video.
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
      description: 'Which collection this photo belongs to',
      validation: (Rule) => Rule.required(),
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
        { name: 'camera',      title: 'Camera',       type: 'string' },
        { name: 'lens',        title: 'Lens',         type: 'string' },
        { name: 'focalLength', title: 'Focal Length',  type: 'string' },
        { name: 'aperture',    title: 'Aperture',     type: 'string' },
        { name: 'iso',         title: 'ISO',          type: 'string' },
        { name: 'shutterSpeed',title: 'Shutter Speed', type: 'string' },
        { name: 'dateTaken',   title: 'Date Taken',   type: 'date' },
        { name: 'location',    title: 'Location',     type: 'string' },
      ],
    },
  ],
  orderings: [
    {
      title: 'Title A–Z',
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
    },
  },
};
