import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 }
  ]
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Open Sans',
  },
  line: {
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 1.5,
    color: '#333333',
  },
  header: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 10,
    color: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingBottom: 2,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 10,
    fontSize: 11,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.5,
  }
});

export const ResumeDocument = ({ text }: { text: string }) => {
  // Simple heuristic parsing to make raw text look slightly better
  const lines = text.split('\\n').filter(l => l.trim().length > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {lines.map((line, index) => {
          const isHeader = line.length < 30 && line === line.toUpperCase() && !line.includes('•');
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          
          if (isHeader) {
            return <Text key={index} style={styles.header}>{line}</Text>;
          }
          
          if (isBullet) {
            return (
              <View key={index} style={styles.bullet}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{line.replace(/^[-•]\\s*/, '')}</Text>
              </View>
            );
          }

          return <Text key={index} style={styles.line}>{line}</Text>;
        })}
      </Page>
    </Document>
  );
};
