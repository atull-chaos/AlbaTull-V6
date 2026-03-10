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
