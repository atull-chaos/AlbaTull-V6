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
