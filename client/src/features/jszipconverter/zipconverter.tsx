import JSZip from 'jszip';

export async function unzipFile(file: File): Promise<Record<string, string>> {
  try {
    // Читаем содержимое файла как ArrayBuffer
    const fileData = await file.arrayBuffer();

    // Инициализируем JSZip и распаковываем содержимое
    const zip = await JSZip.loadAsync(fileData);

    // Обходим файлы в архиве и извлекаем их содержимое
    const files: Record<string, string> = {};
    await Promise.all(
      Object.keys(zip.files).map(async (fileName) => {
        const fileContent = await zip.files[fileName].async('string');
        files[fileName] = fileContent; // Сохраняем содержимое файла
      }),
    );

    console.log('Распакованные файлы:', files);
    return files;
  } catch (error) {
    console.error('Ошибка при разархивировании:', error);
    throw new Error('Не удалось распаковать архив');
  }
}
