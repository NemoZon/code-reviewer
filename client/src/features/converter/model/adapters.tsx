import { Criticality, Json } from './types';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import React from 'react';

Font.register({
  family: 'Roboto',
  src: '/assets/font/Roboto/Roboto-Regular.ttf',
  fontWeight: 'normal',
  fonts: [
    {
      src: '/assets/font/Roboto/Roboto-Light.ttf',
      fontWeight: 'light',
    },
    {
      src: '/assets/font/Roboto/Roboto-Bold.ttf',
      fontWeight: 'bold',
    },
    {
      src: '/assets/font/Roboto/Roboto-Regular.ttf',
      fontWeight: 'normal',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    fontFamily: 'Roboto',
    flexDirection: 'column',
    backgroundColor: '#fafafa',
  },
  section: {
    margin: 30,
    padding: 10,
  },
  text: {
    fontWeight: 'normal',
    fontSize: 14,
  },
  issueTypeWrapper: {
    flexDirection: 'column',
    backgroundColor: '#f5f5f1',
    border: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  issueTypeText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#333',
    lineHeight: 1.5,
  },
  type: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 21,
  },
  criticalityText: {
    color: 'black',
    fontSize: 12,
    fontWeight: 'bold',
    padding: 5,
    borderRadius: 3,
  },
  critical: {
    color: '#ff4d4f',
  },
  high: {
    color: '#faad14',
  },
  medium: {
    color: '#1890ff',
  },
  low: {
    color: '#52c41a',
  },
  location: {
    fontSize: 14,
    color: '#555',
    textDecoration: 'underline',
    marginBottom: 5,
  },
  suggestion: {
    fontSize: 12,
    color: '#0056b3',
    fontWeight: 'bold',
    marginTop: 5,
  },
  lang: {
    fontSize: 12,
    color: 'white',
    backgroundColor: 'black',
    fontWeight: 'light',
    margin: 10,
  },
});

export const mockJson: Json[] = [
  {
    file: 'App.tsx',
    issues: [
      {
        type: 'Ошибка в именовании функции',
        criticality: Criticality.Critical,
        location: 'Линия 12',
        description: 'Хук "myConst" должен начинатся с ключевого слова "use"',
        suggestion: 'Исправленная версия выглядит так: myConst => useMyConst',
      },
    ],
  },
  {
    file: 'App.tsx',
    issues: [
      {
        type: 'Ошибка в именовании функции',
        criticality: Criticality.Critical,
        location: 'Линия 12',
        description: 'Хук "myConst" должен начинатся с ключевого слова "use"',
        suggestion: 'Исправленная версия выглядит так: myConst => useMyConst',
      },
    ],
  },
];

function IssueType({ children }: { children: string }) {
  return <Text style={[styles.type]}>{children}</Text>;
}

function CriticalityText({ children }: { children: Criticality }) {
  const colorStyle =
    children === 'Critical'
      ? styles.critical
      : children === 'High'
        ? styles.high
        : children === 'Medium'
          ? styles.medium
          : styles.low;
  return (
    <Text>
      <Text style={[styles.criticalityText]}>Критичность: </Text>
      <Text style={[styles.criticalityText, colorStyle]}>{children}</Text>
    </Text>
  );
}

function Code({
  children,
  language,
}: {
  children: string[] | string;
  language: string;
}) {
  return (
    <View>
      {/* {language && (
        <View>
          <Text style={styles.lang}>Язык {language + '\n'}</Text>
        </View>
      )} */}
      <View style={styles.issueTypeWrapper}>
        <Text style={styles.issueTypeText}>{children}</Text>
      </View>
    </View>
  );
}

function Line({ children }: { children: string[] | string }) {
  return <Text style={styles.location}>{children}</Text>;
}

function Suggestion({ children }: { children: string[] | string }) {
  return <Text style={styles.suggestion}>{children}</Text>;
}

// Обработка текста
const renderLine = (text: string) => {
  const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g; // Регулярное выражение для поиска всех шаблонов
  const parts = [];
  let lastIndex = 0;

  // Ищем все совпадения с помощью matchAll
  const matches = [...text.matchAll(codeBlockRegex)];

  for (const match of matches) {
    const [fullMatch, language, code] = match; // Полное совпадение и части шаблона
    const startIndex = match.index!;

    // Добавляем текст перед блоком кода
    if (startIndex > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, startIndex),
      });
    }

    // Добавляем блок кода
    parts.push({
      type: 'code',
      language,
      content: code.replace(/ /g, '\u00A0') + '\n', // Преобразуем пробелы в неразрывные
    });

    // Обновляем индекс
    lastIndex = startIndex + fullMatch.length;
  }

  // Добавляем оставшийся текст после последнего блока кода
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  // Рендерим части
  return (
    <Text style={styles.text}>
      {parts.map((part, index) =>
        part.type === 'code' ? (
          <Code language={part.language || 'bash'} key={index}>
            {part.content}
          </Code>
        ) : (
          part.content.split('\n').map((line, lineIndex) => (
            <React.Fragment key={`${index}-${lineIndex}`}>
              {line.replace(/ /g, '\u00A0')}
              {lineIndex !== part.content.split('\n').length - 1 && '\n'}
            </React.Fragment>
          ))
        ),
      )}
    </Text>
  );
};

export function jsonToPdf(jsons: Json[]) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {jsons.map((json) => (
          <View>
            <Text style={styles.title}>Отчет {json.file}</Text>
            <View style={styles.section}>
              {json.issues.map((issue, index) => (
                <View key={index}>
                  <IssueType>{issue.type}</IssueType>
                  <CriticalityText>{issue.criticality}</CriticalityText>
                  <Line>{issue.location}</Line>
                  {issue.description && renderLine(issue.description)}
                  {issue.suggestion && renderLine(issue.suggestion)}
                </View>
              ))}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
