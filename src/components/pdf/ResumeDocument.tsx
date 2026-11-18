import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

export interface ResumeData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  summary?: string;
  experience?: Array<{
    company?: string;
    role?: string;
    date?: string;
    location?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    date?: string;
    location?: string;
    gpa?: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    name?: string;
    description?: string;
    link?: string;
    date?: string;
    bullets?: string[];
  }>;
  skills?: Array<{
    category?: string;
    items?: string[];
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
  customSections?: Array<{
    title: string;
    content?: string;
    bullets?: string[];
  }>;
}

// ── Exact LaTeX / Jake's Resume (Overleaf) Stylesheet ──
const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 36, // Exact 0.5 inch margins
    fontFamily: 'Times-Roman',
    fontSize: 9.5,
    lineHeight: 1.25,
    color: '#000000',
  },

  // Header / Personal Info
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 21,
    fontFamily: 'Times-Bold',
    color: '#000000',
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nameSpacer: {
    height: 13, // Absorbs Times-Bold font descent & provides crisp 4pt separation
    width: '100%',
  },
  contactRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  contactText: {
    fontSize: 8.5,
    color: '#111111',
  },
  contactLink: {
    fontSize: 8.5,
    color: '#000000',
    textDecoration: 'none',
  },
  contactSeparator: {
    fontSize: 8.5,
    color: '#444444',
    marginHorizontal: 3.5,
  },
  afterHeaderSpacer: {
    height: 6,
    width: '100%',
  },

  // LaTeX Section Headers (\section with \titlerule)
  sectionHeader: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    paddingBottom: 1.5,
    marginTop: 6,
    marginBottom: 4,
  },

  // Summary (if present)
  summaryText: {
    fontSize: 9,
    lineHeight: 1.3,
    color: '#111111',
    marginBottom: 4,
  },

  // LaTeX Subheading Item (\resumeSubheading)
  entryContainer: {
    marginBottom: 4.5,
  },
  subheadingRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  subheadingRow2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1.5,
  },
  boldLeft: {
    fontFamily: 'Times-Bold',
    fontSize: 9.5,
    color: '#000000',
  },
  boldRight: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    color: '#000000',
    textAlign: 'right',
  },
  italicLeft: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
    color: '#111111',
  },
  italicRight: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
    color: '#222222',
    textAlign: 'right',
  },

  // LaTeX Itemize Bullets (\resumeItemListStart / \resumeItem)
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
    paddingLeft: 10,
  },
  bulletPoint: {
    width: 8,
    fontSize: 7.5,
    color: '#000000',
    paddingTop: 1,
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.25,
    color: '#111111',
  },

  // LaTeX Skills Row (\textbf{Category}{: items})
  skillRow: {
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 9,
    lineHeight: 1.25,
  },
  skillCategory: {
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginRight: 3,
  },
  skillItems: {
    flex: 1,
    color: '#111111',
  },
});

const cleanDisplayUrl = (url?: string) => {
  if (!url) return '';
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
};

const formatBullet = (bullet: string) => {
  return bullet.replace(/^[-•*–—]\s*/, '').trim();
};

export const ResumeDocument = ({ data }: { data: ResumeData }) => {
  const p = data.personalInfo;

  // Build clean contact items
  const contactParts: Array<{ text: string; link?: string }> = [];
  if (p?.phone) contactParts.push({ text: p.phone });
  if (p?.email) contactParts.push({ text: p.email, link: `mailto:${p.email}` });
  if (p?.location) contactParts.push({ text: p.location });
  if (p?.linkedin) contactParts.push({ text: cleanDisplayUrl(p.linkedin), link: p.linkedin.startsWith('http') ? p.linkedin : `https://${p.linkedin}` });
  if (p?.github) contactParts.push({ text: cleanDisplayUrl(p.github), link: p.github.startsWith('http') ? p.github : `https://${p.github}` });
  if (p?.portfolio) contactParts.push({ text: cleanDisplayUrl(p.portfolio), link: p.portfolio.startsWith('http') ? p.portfolio : `https://${p.portfolio}` });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* ── LaTeX Header ── */}
        {p && (
          <View style={styles.headerContainer}>
            {p.name && <Text style={styles.name}>{p.name}</Text>}
            <View style={styles.nameSpacer} />
            <View style={styles.contactRow}>
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <Text style={styles.contactSeparator}>|</Text>}
                  {item.link ? (
                    <Link src={item.link} style={styles.contactLink}>
                      {item.text}
                    </Link>
                  ) : (
                    <Text style={styles.contactText}>{item.text}</Text>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        )}
        <View style={styles.afterHeaderSpacer} />

        {/* ── Professional Summary (Optional) ── */}
        {data.summary && (
          <View>
            <Text style={styles.sectionHeader}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        )}

        {/* ── Education (Jake's LaTeX Position #1) ── */}
        {data.education && data.education.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={styles.entryContainer}>
                {/* Line 1: School (Bold) \hfill Location (Bold) */}
                <View style={styles.subheadingRow1}>
                  <Text style={styles.boldLeft}>{edu.institution}</Text>
                  <Text style={styles.boldRight}>{edu.location || ''}</Text>
                </View>
                {/* Line 2: Degree & GPA (Italic) \hfill Date (Italic) */}
                <View style={styles.subheadingRow2}>
                  <Text style={styles.italicLeft}>
                    {edu.degree}{edu.gpa ? `; GPA: ${edu.gpa}` : ''}
                  </Text>
                  <Text style={styles.italicRight}>{edu.date || ''}</Text>
                </View>
                {edu.bullets && edu.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{formatBullet(b)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Work Experience ── */}
        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={styles.entryContainer}>
                {/* Line 1: Company (Bold) \hfill Location (Bold) */}
                <View style={styles.subheadingRow1}>
                  <Text style={styles.boldLeft}>{exp.company || exp.role}</Text>
                  <Text style={styles.boldRight}>{exp.location || ''}</Text>
                </View>
                {/* Line 2: Role (Italic) \hfill Dates (Italic) */}
                <View style={styles.subheadingRow2}>
                  <Text style={styles.italicLeft}>{exp.role || ''}</Text>
                  <Text style={styles.italicRight}>{exp.date || ''}</Text>
                </View>
                {/* Bullets */}
                {exp.bullets && exp.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{formatBullet(b)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Projects ── */}
        {data.projects && data.projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Projects</Text>
            {data.projects.map((proj, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.subheadingRow1}>
                  <Text style={styles.boldLeft}>{proj.name}</Text>
                  <Text style={styles.boldRight}>{proj.date || ''}</Text>
                </View>
                {proj.description && (
                  <View style={styles.subheadingRow2}>
                    <Text style={styles.italicLeft}>{proj.description}</Text>
                  </View>
                )}
                {proj.bullets && proj.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletContent}>{formatBullet(b)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Technical Skills ── */}
        {data.skills && data.skills.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Technical Skills</Text>
            {data.skills.map((skill, idx) => (
              <View key={idx} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{skill.category}:</Text>
                <Text style={styles.skillItems}>{skill.items?.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Certifications (Optional) ── */}
        {data.certifications && data.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Certifications</Text>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={styles.subheadingRow1}>
                <Text style={styles.boldLeft}>{cert.name} {cert.issuer ? `– ${cert.issuer}` : ''}</Text>
                <Text style={styles.italicRight}>{cert.date || ''}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Custom Sections (Canva Style) ── */}
        {data.customSections && data.customSections.map((sec, idx) => (
          <View key={idx}>
            <Text style={styles.sectionHeader}>{sec.title}</Text>
            {sec.content && <Text style={styles.summaryText}>{sec.content}</Text>}
            {sec.bullets && sec.bullets.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletContent}>{formatBullet(b)}</Text>
              </View>
            ))}
          </View>
        ))}

      </Page>
    </Document>
  );
};
