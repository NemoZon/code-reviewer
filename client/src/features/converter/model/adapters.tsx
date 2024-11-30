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
        <View style={styles.section}>
          <Text>Отчет {json.file}:</Text>
        </View>
        <Text>Отчет {json.file}:</Text>
        <Text>Отчет {json.file}:</Text>
        <Text>Отчет {json.file}:</Text>
        <View style={styles.section}>
          <Text>Section #2</Text>
        </View>
      </Page>
    </Document>
  );
}
