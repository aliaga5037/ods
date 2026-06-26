import { describe, it, expect } from 'vitest';
import { organizationSchema, articleSchema, breadcrumbSchema } from './seo';

const SITE = 'https://www.oilmends.com';

describe('organizationSchema', () => {
  it('emits an Organization with an absolute logo URL and address', () => {
    const s = organizationSchema(SITE);
    expect(s['@type']).toBe('Organization');
    expect(s.logo).toBe('https://www.oilmends.com/images/logo.jpeg');
    expect(s.address.addressLocality).toBe('Baku');
    expect(s.telephone).toBeTruthy();
  });
});

describe('articleSchema', () => {
  it('emits a BlogPosting with headline and publisher', () => {
    const s = articleSchema({
      title: 'Barite sag in HPHT', description: 'x', url: `${SITE}/insights/x`,
      image: `${SITE}/images/og-default.jpg`, siteUrl: SITE,
      datePublished: '2026-01-01T00:00:00.000Z', author: 'ODS Team',
    });
    expect(s['@type']).toBe('BlogPosting');
    expect(s.headline).toBe('Barite sag in HPHT');
    expect(s.datePublished).toBe('2026-01-01T00:00:00.000Z');
    expect(s.publisher['@type']).toBe('Organization');
  });
  it('omits datePublished when not provided', () => {
    const s = articleSchema({ title: 'x', description: 'y', url: SITE, image: SITE, siteUrl: SITE });
    expect('datePublished' in s).toBe(false);
  });
});

describe('breadcrumbSchema', () => {
  it('numbers positions starting at 1', () => {
    const s = breadcrumbSchema([
      { name: 'Home', url: `${SITE}/` },
      { name: 'Insights', url: `${SITE}/insights` },
      { name: 'Post', url: `${SITE}/insights/post` },
    ]);
    expect(s.itemListElement).toHaveLength(3);
    expect(s.itemListElement[0].position).toBe(1);
    expect(s.itemListElement[2].position).toBe(3);
    expect(s.itemListElement[2].name).toBe('Post');
  });
});
