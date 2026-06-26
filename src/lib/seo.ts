// Pure builders for JSON-LD structured data. Kept framework-free so they can be
// unit-tested; the JsonLd.astro component serializes whatever these return.
import { site, contact } from '../data/site';

const LOGO_PATH = '/images/logo.jpeg';

export function organizationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: site.legalName,
    alternateName: site.name,
    url: siteUrl,
    logo: new URL(LOGO_PATH, siteUrl).href,
    description: site.subhead,
    email: contact.email,
    telephone: contact.phone,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Baku',
      addressCountry: 'AZ',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: contact.phone,
      email: contact.email,
      contactType: 'sales',
      areaServed: 'Worldwide',
    },
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  image: string;
  siteUrl: string;
  datePublished?: string;
  author?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    mainEntityOfPage: opts.url,
    image: opts.image,
    author: { '@type': 'Person', name: opts.author || 'ODS Team' },
    publisher: {
      '@type': 'Organization',
      name: site.legalName,
      logo: { '@type': 'ImageObject', url: new URL(LOGO_PATH, opts.siteUrl).href },
    },
    ...(opts.datePublished ? { datePublished: opts.datePublished } : {}),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}
