import { PDFViewer } from '@react-pdf/renderer';
import { jsonToPdf, mockJson } from '../model/Adapters';

function Preview() {
  return (
    <PDFViewer style={{ width: 700, aspectRatio: '4/5' }}>
      {jsonToPdf(mockJson)}
    </PDFViewer>
  );
}

export default Preview;
