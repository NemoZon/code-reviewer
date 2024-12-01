import { PDFViewer } from '@react-pdf/renderer';
import { Json } from '../model/types';
import { jsonToPdf } from '../model/adapters';

interface IPreview {
  file: Json[];
}

function Preview({ file }: IPreview) {
  return (
    <PDFViewer style={{ width: 700, aspectRatio: '4/5' }}>
      {jsonToPdf(file)}
    </PDFViewer>
  );
}

export default Preview;
