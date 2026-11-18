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
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 36, // ~0.5 inch margins
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#1e293b',
  },
  // Header / Personal Info
  headerContainer: {
    marginBottom: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: 8.5,
    color: '#475569',
  },
  contactItem: {
    marginHorizontal: 3,
  },
  contactLink: {
    color: '#2563eb',
    textDecoration: 'none',
  },
  dividerDot: {
    color: '#94a3b8',
    marginHorizontal: 3,
  },

  // Section Headers
  sectionHeader: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb',
    paddingBottom: 2,
    marginTop: 8,
    marginBottom: 5,
  },

  // Summary
  summary: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#334155',
    marginBottom: 4,
  },

  // Experience / Projects / Education Entries
  entryContainer: {
    marginBottom: 6,
  },
  entryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1.5,
  },
  primaryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#0f172a',
  },
  secondaryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#1e293b',
  },
  subtitle: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: '#334155',
  },
  dateLocation: {
    fontSize: 8.5,
    color: '#64748b',
    textAlign: 'right',
  },

  // Bullet Points
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 8.5,
    color: '#2563eb',
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.35,
    color: '#334155',
  },

  // Skills
  skillsContainer: {
    marginTop: 2,
  },
  skillRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
    fontSize: 9,
  },
  skillCategory: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginRight: 4,
  },
  skillItems: {
    flex: 1,
    color: '#334155',
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
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* Personal Info Header */}
        {data.personalInfo && (
          <View style={styles.headerContainer}>
            {data.personalInfo.name && <Text style={styles.name}>{data.personalInfo.name}</Text>}
            <View style={styles.contactRow}>
              {data.personalInfo.location && (
                <Text style={styles.contactItem}>{data.personalInfo.location}</Text>
              )}
              {data.personalInfo.phone && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <Text style={styles.contactItem}>{data.personalInfo.phone}</Text>
                </>
              )}
              {data.personalInfo.email && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <Link src={`mailto:${data.personalInfo.email}`} style={[styles.contactItem, styles.contactLink]}>
                    {data.personalInfo.email}
                  </Link>
                </>
              )}
              {data.personalInfo.linkedin && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <Link src={data.personalInfo.linkedin.startsWith('http') ? data.personalInfo.linkedin : `https://${data.personalInfo.linkedin}`} style={[styles.contactItem, styles.contactLink]}>
                    {cleanDisplayUrl(data.personalInfo.linkedin)}
                  </Link>
                </>
              )}
              {data.personalInfo.github && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <Link src={data.personalInfo.github.startsWith('http') ? data.personalInfo.github : `https://${data.personalInfo.github}`} style={[styles.contactItem, styles.contactLink]}>
                    {cleanDisplayUrl(data.personalInfo.github)}
                  </Link>
                </>
              )}
              {data.personalInfo.portfolio && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <Link src={data.personalInfo.portfolio.startsWith('http') ? data.personalInfo.portfolio : `https://${data.personalInfo.portfolio}`} style={[styles.contactItem, styles.contactLink]}>
                    {cleanDisplayUrl(data.personalInfo.portfolio)}
                  </Link>
                </>
              )}
            </View>
          </View>
        )}

        {/* Professional Summary */}
        {data.summary && (
          <View>
            <Text style={styles.sectionHeader}>Professional Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Technical Skills */}
        {data.skills && data.skills.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.sectionHeader}>Technical Skills</Text>
            <View style={styles.skillsContainer}>
              {data.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillRow}>
                  <Text style={styles.skillCategory}>{skill.category}:</Text>
                  <Text style={styles.skillItems}>{skill.items?.join(', ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Work Experience */}
        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Work Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.primaryTitle}>{exp.role || exp.company}</Text>
                  <Text style={styles.dateLocation}>{exp.date}</Text>
                </View>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.subtitle}>{exp.company} {exp.location ? `| ${exp.location}` : ''}</Text>
                </View>
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

        {/* Key Projects */}
        {data.projects && data.projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Key Projects</Text>
            {data.projects.map((proj, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.secondaryTitle}>{proj.name}</Text>
                  <Text style={styles.dateLocation}>{proj.date}</Text>
                </View>
                {proj.description && <Text style={styles.subtitle}>{proj.description}</Text>}
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

        {/* Education */}
        {data.education && data.education.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Education</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={styles.entryContainer}>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.primaryTitle}>{edu.institution}</Text>
                  <Text style={styles.dateLocation}>{edu.location ? `${edu.location}` : edu.date}</Text>
                </View>
                <View style={styles.entryHeaderRow}>
                  <Text style={styles.subtitle}>{edu.degree} {edu.gpa ? `| GPA: ${edu.gpa}` : ''}</Text>
                  {edu.location && <Text style={styles.dateLocation}>{edu.date}</Text>}
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

        {/* Certifications & Credentials */}
        {data.certifications && data.certifications.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Certifications</Text>
            {data.certifications.map((cert, idx) => (
              <View key={idx} style={styles.entryHeaderRow}>
                <Text style={styles.secondaryTitle}>{cert.name} {cert.issuer ? `– ${cert.issuer}` : ''}</Text>
                {cert.date && <Text style={styles.dateLocation}>{cert.date}</Text>}
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
};
