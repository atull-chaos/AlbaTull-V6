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
