import { Document, Page, Text, View, StyleSheet, Font, Link } from '@react-pdf/renderer';

// Register fonts (Using standard serif for ATS Harvard style)
Font.register({
  family: 'Times-Roman',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times%20New%20Roman%20Bold.ttf', fontWeight: 'bold' }
  ]
});

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
}

const styles = StyleSheet.create({
  page: {
    padding: '36pt', // 0.5 inch margins
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.2,
    color: '#000000',
  },
  // Personal Info
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    fontSize: 10,
  },
  contactItem: {
    marginHorizontal: 4,
  },
  // Section Headers
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 2,
    marginBottom: 6,
    marginTop: 8,
  },
  // Summary
  summary: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  // Experience / Education Block
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  dateLocation: {
    fontSize: 11,
  },
  jobTitle: {
    fontStyle: 'italic',
    marginBottom: 4,
  },
  // Bullets
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  bulletPoint: {
    width: 12,
  },
  bulletText: {
    flex: 1,
    textAlign: 'justify',
  },
  // Skills
  skillCategory: {
    fontWeight: 'bold',
  },
  skillRow: {
    flexDirection: 'row',
    marginBottom: 3,
  }
});

export const ResumeDocument = ({ data }: { data: ResumeData }) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        
        {/* Personal Info */}
        {data.personalInfo && (
          <View>
            {data.personalInfo.name && <Text style={styles.name}>{data.personalInfo.name}</Text>}
            <View style={styles.contactRow}>
              {data.personalInfo.location && <Text style={styles.contactItem}>{data.personalInfo.location}</Text>}
              {data.personalInfo.phone && <Text style={styles.contactItem}>| {data.personalInfo.phone}</Text>}
              {data.personalInfo.email && <Text style={styles.contactItem}>| {data.personalInfo.email}</Text>}
              {data.personalInfo.linkedin && <Text style={styles.contactItem}>| {data.personalInfo.linkedin}</Text>}
              {data.personalInfo.github && <Text style={styles.contactItem}>| {data.personalInfo.github}</Text>}
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

        {/* Experience */}
        {data.experience && data.experience.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Experience</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.companyName}>{exp.company}</Text>
                  <Text style={styles.dateLocation}>{exp.date} {exp.location ? `| ${exp.location}` : ''}</Text>
                </View>
                {exp.role && <Text style={styles.jobTitle}>{exp.role}</Text>}
                {exp.bullets && exp.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletContainer}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{b.replace(/^[-•]\\s*/, '')}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Projects</Text>
            {data.projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.companyName}>{proj.name}</Text>
                  <Text style={styles.dateLocation}>{proj.date}</Text>
                </View>
                {proj.description && <Text style={styles.jobTitle}>{proj.description}</Text>}
                {proj.bullets && proj.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletContainer}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{b.replace(/^[-•]\\s*/, '')}</Text>
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
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.entryHeader}>
                  <Text style={styles.companyName}>{edu.institution}</Text>
                  <Text style={styles.dateLocation}>{edu.date}</Text>
                </View>
                <View style={styles.entryHeader}>
                  <Text style={styles.jobTitle}>{edu.degree}</Text>
                  {edu.gpa && <Text style={styles.dateLocation}>GPA: {edu.gpa}</Text>}
                </View>
                {edu.bullets && edu.bullets.map((b, i) => (
                  <View key={i} style={styles.bulletContainer}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.bulletText}>{b.replace(/^[-•]\\s*/, '')}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills && data.skills.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Technical Skills</Text>
            {data.skills.map((skill, idx) => (
              <View key={idx} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{skill.category}: </Text>
                <Text>{skill.items?.join(', ')}</Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
};
