import style from 'react-syntax-highlighter/dist/esm/styles/hljs/a11y-dark';
import { Json } from './types';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  src: '/assets/font/Roboto/Roboto-Regular.ttf',
  fontWeight: 'normal',
  fonts: [
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
});

export const mockJson: Json = {
  file: 'App.tsx',
  score: 80,
  issues: [
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
    'Хук "myConst" должен начинатся с ключевого слова "use"',
  ],
  // issues: [
  //   {
  //     type: 'Ошибка в именовании функции',
  //     criticality: 'Medium',
  //     location: 'Линия 12',
  //     description: 'Хук "myConst" должен начинатся с ключевого слова "use"',
  //     suggestion: 'Исправленная версия выглядит так: myConst => useMyConst',
  //   },
  // ],
};

export function jsonToPdf(json: Json) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text>Отчет {json.file}:</Text>
        <View style={styles.section}>
          {json.issues.map((text, index) => {
            return (
              <Text style={styles.text} key={index}>
                {text}
              </Text>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
